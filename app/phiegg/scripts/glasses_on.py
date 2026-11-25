#!/usr/bin/env python3
"""Put Phiegg's glasses on the mannequin, lit as a product is, and render it.

The glasses are scripts/glasses.py's, drawn on Phi-Hard: their frames, lenses, bridge and hinges are made solid
(acetate frames, glass lenses, gold hinges and temples) and hung from the empty the mannequin's own glasses hang
from (on its head bone), as wide as the front piece of the pair it wears; that pair is hidden. The light is a
large soft one above and ahead, as on the lunch box and the tub under a lamp, a faint fill and a rim, on a pale
ground as Apple's pages stand a product. Two cameras: the face, and a three-quarter turn.

The mannequin's file is only read. Writes art/glasses-on-front.png and art/glasses-on-turn.png, and with --save the
scene beside the renders (art/glasses-on.blend).
    python scripts/glasses_on.py [--samples 64] [--size 1200] [--save]
"""
import argparse, math, os, sys

import bpy
import bmesh  # noqa: E402 (Blender's module makes bmesh known)
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import glasses  # noqa: E402

ROOT = os.path.join(HERE, '..')
ART = os.path.join(ROOT, 'art')
SOURCE = os.path.join(ROOT, '..', '..', '..', 'phikit', 'crates', 'phiber', 'assets', 'production', 'Mannequins-Female--Pose-05.blend')
CTRL = 'glasses main ctrl.013'
SHOWN = '02.013'

args = argparse.ArgumentParser()
args.add_argument('--samples', type=int, default=64)
args.add_argument('--size', type=int, default=1200)
args.add_argument('--save', action='store_true')
args = args.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:])

try:
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(SOURCE))
except RuntimeError as why:
    # Three broken shape keys are reported as an error; the file is open.
    print('opened:', str(why).splitlines()[0])
scene = bpy.context.scene
ctrl = bpy.data.objects[CTRL]
inverse = ctrl.matrix_world.inverted()

# The pair it wears, in the empty's own space: its front piece (the widest flat one) says which way is across,
# which way is up and which way is through; its temples which way is back.
shown = bpy.data.collections[SHOWN]


def local_points(ob):
    return [inverse @ (ob.matrix_world @ v.co) for v in ob.data.vertices]


meshes = [ob for ob in shown.all_objects if ob.type == 'MESH']
front = max(meshes, key=lambda ob: max(ob.dimensions))
pts = local_points(front)
lo = Vector([min(p[i] for p in pts) for i in range(3)])
hi = Vector([max(p[i] for p in pts) for i in range(3)])
extent = hi - lo
order = sorted(range(3), key=lambda i: extent[i], reverse=True)
across, up, through = order[0], order[1], order[2]
centre = (lo + hi) / 2
every = [p for ob in meshes for p in local_points(ob)]
behind = sum(p[through] for p in every) / len(every)
back = 1.0 if behind > centre[through] else -1.0   # the temples run this way along `through`
depth_back = max(abs(p[through] - centre[through]) for p in every)
# Which way is up: the front piece's top is where its nose pad is not; take the head bone's up in this space.
head_up = (inverse.to_3x3() @ Vector((0, 0, 1))).normalized()
up_sign = 1.0 if head_up[up] >= 0 else -1.0
for coll in [shown] + list(shown.children):
    coll.hide_render = True
    coll.hide_viewport = True

t, size, frames, bridge, hinges, m = glasses.build(glasses.FONT)
ink = t['color']
left, right = m['left'], m['left'] + m['frame_w'] * 2 + m['bridge']
top, high = m['top'], size['frame']
scale = extent[across] * size['fit'] / (right - left)
mid_x, mid_y = (left + right) / 2, top + high / 2


def place(x, y, z):
    """A point of the drawing (pixels, y down) at a depth (metres, toward the back), in the empty's space."""
    v = Vector((0.0, 0.0, 0.0))
    v[across] = centre[across] + (x - mid_x) * scale
    v[up] = centre[up] + up_sign * (mid_y - y) * scale
    v[through] = centre[through] + back * z
    return v


def material(name, colour, **kind):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes['Principled BSDF']
    c = tuple(int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    p.inputs['Base Color'].default_value = (*[v ** 2.2 for v in c], 1.0)
    for key, value in kind.items():
        p.inputs[key].default_value = value
    return mat


# Black acetate keeps its black: a soft sheen and the light caught at its edges, never the lamp mirrored across
# its face (the head tips back, and the frames look up into the key light).
acetate = material('phi-acetate', ink['acetate'], **{'Roughness': 0.5, 'Specular IOR Level': 0.25})
metal = material('phi-gold', ink['metal'], **{'Metallic': 1.0, 'Roughness': 0.28})
glass = material('phi-lens', ink['glass'], **{'Transmission Weight': 1.0, 'Roughness': 0.03, 'IOR': 1.5})


def solid(name, loops, thick, mat, bevel=0.0):
    """A solid from closed outlines (a hole where one stands inside another), as deep as `thick`, hung from the empty."""
    bm = bmesh.new()
    edges = []
    for loop in loops:
        verts = [bm.verts.new(place(x, y, 0.0)) for x, y in loop]
        edges += [bm.edges.new((verts[i], verts[(i + 1) % len(verts)])) for i in range(len(verts))]
    bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=True, edges=edges)
    faces = list(bm.faces)
    grown = bmesh.ops.extrude_face_region(bm, geom=faces)
    shift = Vector((0, 0, 0))
    shift[through] = back * thick
    bmesh.ops.translate(bm, vec=shift, verts=[g for g in grown['geom'] if isinstance(g, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new(name, mesh)
    ob.data.materials.append(mat)
    scene.collection.objects.link(ob)
    ob.parent = ctrl
    ob.matrix_parent_inverse = Matrix.Identity(4)
    if bevel:
        mod = ob.modifiers.new('round', 'BEVEL')
        mod.width, mod.segments, mod.limit_method = bevel, 3, 'ANGLE'
    for poly in mesh.polygons:
        poly.use_smooth = False
    return ob


frame_loops = []
for outer, counter in frames:
    frame_loops += [outer, counter]
solid('phi-frames', frame_loops, size['depth'], acetate, size['bevel'])
solid('phi-bridge', [bridge], size['depth'] * 0.85, acetate, size['bevel'])
for n, (outer, counter) in enumerate(frames):
    lens = solid('phi-lens-%d' % n, [counter], size['lens.depth'], glass)
    lens.location[through] += back * (size['depth'] - size['lens.depth']) / 2
# Hinges, and the gold temples from them back along the head as far as the pair's own run.
for n, (x, y, w, h, side) in enumerate(hinges):
    solid('phi-hinge-%d' % n, [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]], size['depth'], acetate, size['bevel'] / 2)
    edge = x if side == 'left' else x + w
    run = depth_back
    bm = bmesh.new()
    t0, t1 = size['temple'] / scale, size['temple.high'] / scale
    corners = []
    for dz in (0.0, run):
        for dx, dy in ((0, 0), (t0, 0), (t0, t1), (0, t1)):
            sign = 1 if side == 'right' else -1
            corners.append(place(edge + sign * dx, y + h / 2 - t1 / 2 + dy, size['depth'] * 0.5 + dz))
    verts = [bm.verts.new(c) for c in corners]
    for face in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
        bm.faces.new([verts[i] for i in face])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('phi-temple-%d' % n)
    bm.to_mesh(mesh)
    bm.free()
    ob = bpy.data.objects.new('phi-temple-%d' % n, mesh)
    ob.data.materials.append(metal)
    scene.collection.objects.link(ob)
    ob.parent = ctrl
    ob.matrix_parent_inverse = Matrix.Identity(4)

# The light and the ground.
world = scene.world or bpy.data.worlds.new('studio')
scene.world = world
world.use_nodes = True
# The ground as the camera sees it is bright, as Apple's pages stand a product; as light on the head it is faint,
# so black stays black and the lamps do the lighting.
nodes, links = world.node_tree.nodes, world.node_tree.links
bg = nodes.get('Background')
studio = tuple(int(ink['studio'][i:i + 2], 16) / 255 for i in (1, 3, 5))
bg.inputs['Color'].default_value = (*[v ** 2.2 for v in studio], 1.0)
bg.inputs['Strength'].default_value = size['ground']
seen = nodes.new('ShaderNodeBackground')
seen.inputs['Color'].default_value = bg.inputs['Color'].default_value
seen.inputs['Strength'].default_value = size['backdrop']
path = nodes.new('ShaderNodeLightPath')
mix = nodes.new('ShaderNodeMixShader')
links.new(path.outputs['Is Camera Ray'], mix.inputs[0])
links.new(bg.outputs[0], mix.inputs[1])
links.new(seen.outputs[0], mix.inputs[2])
links.new(mix.outputs[0], nodes['World Output'].inputs['Surface'])
face = ctrl.matrix_world.translation.copy()
# The way the face looks, level: the front of the glasses, in the world.
facing = Vector((0.0, 0.0, 0.0))
facing[through] = -back
toward = ctrl.matrix_world.to_3x3() @ facing
toward.z = 0
toward.normalize()


def light(name, kind, power, offset, size_m):
    data = bpy.data.lights.new(name, kind)
    data.energy = power
    if kind == 'AREA':
        data.shape, data.size = 'DISK', size_m
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    ob.location = face + offset
    look = (face - ob.location).to_track_quat('-Z', 'Y')
    ob.rotation_euler = look.to_euler()
    return ob


side = Vector((-toward.y, toward.x, 0))
# The key stands high, so what the frames mirror of it falls under the eyes, not into the camera.
light('key', 'AREA', size['key'], toward * 0.7 + Vector((0, 0, 1.6)), 2.2)
light('fill', 'AREA', size['fill'], toward * 1.0 + Vector((0, 0, -0.5)), 1.5)
light('rim', 'AREA', size['rim'], -toward * 1.0 + side * 0.6 + Vector((0, 0, 0.6)), 1.0)


def camera(name, turn_degrees):
    data = bpy.data.cameras.new(name)
    data.lens = size['focal']
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    a = math.radians(turn_degrees)
    way = Vector((toward.x * math.cos(a) - toward.y * math.sin(a), toward.x * math.sin(a) + toward.y * math.cos(a), 0))
    ob.location = face + way * size['distance'] + Vector((0, 0, -0.02))
    aim = face + Vector((0, 0, -0.06))
    ob.rotation_euler = (aim - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return ob


scene.render.resolution_x = scene.render.resolution_y = args.size
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
# Cycles, on the graphics card where there is one: EEVEE run without a window draws materials made by a script
# before their shaders are ready, as a plain white.
scene.render.engine = 'CYCLES'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
prefs = bpy.context.preferences.addons['cycles'].preferences
for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
    try:
        prefs.compute_device_type = kind
    except TypeError:
        continue
    prefs.get_devices()
    gpus = [d for d in prefs.devices if d.type == kind]
    if gpus:
        for d in prefs.devices:
            d.use = d.type == kind
        scene.cycles.device = 'GPU'
        print('rendering on', kind, [d.name for d in gpus])
        break
for name, turn in (('front', 0.0), ('turn', size['turn'])):
    scene.camera = camera('glasses-' + name, turn)
    scene.render.filepath = os.path.abspath(os.path.join(ART, 'glasses-on-%s.png' % name))
    try:
        bpy.ops.render.render(write_still=True)
    except RuntimeError as why:
        # A card whose kernels this Blender cannot load: the processor renders it.
        print('on the processor, the card refused:', str(why).splitlines()[0][:120])
        scene.cycles.device = 'CPU'
        bpy.ops.render.render(write_still=True)
    print('rendered', scene.render.filepath)
if args.save:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(ART, 'glasses-on.blend')), copy=True)
    print('saved', os.path.join(ART, 'glasses-on.blend'))
