#!/usr/bin/env python3
"""Put Phiegg's glasses on the mannequin, lit as a product is, and render it.

The glasses are scripts/glasses.py's, drawn on Phi-Hard: made solid by scripts/glasses_make.py (acetate frames,
glass lenses, gold temples and studs) and hung from the empty the mannequin's own glasses hang
from (on its head bone), as wide as the front piece of the pair it wears; that pair is hidden. The light is a
large soft one above and ahead, as on the lunch box and the tub under a lamp, a faint fill and a rim, on a pale
ground as Apple's pages stand a product (scripts/glasses_studio.py). Two cameras: the face, and a three-quarter turn.
The head is first brought level, as a product is shot.

The mannequin's file is only read. Writes art/glasses-on-front.png and art/glasses-on-turn.png, and with --save the
scene beside the renders (art/glasses-on.blend).
    python scripts/glasses_on.py [--samples 64] [--size 1200] [--save]
"""
import argparse, math, os, sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import glasses  # noqa: E402
import glasses_studio as studio  # noqa: E402
from glasses_make import Maker  # noqa: E402

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

# The head brought level, as a product is shot (art/glasses.tsv `level`, 1 all the way, 0 as the file holds it): it
# turns about its own bone, about the level line across the face, until the glasses look straight ahead.
facing = Vector((0.0, 0.0, 0.0))
facing[through] = -back
rig = ctrl.parent
head = rig.pose.bones[ctrl.parent_bone]
looks = (ctrl.matrix_world.to_3x3() @ facing).normalized()
pitch = math.asin(max(-1.0, min(1.0, looks.z)))
side = looks.cross(Vector((0, 0, 1)))
if side.length > 1e-6 and size['level'] > 0:
    world_head = rig.matrix_world @ head.matrix
    pivot = world_head.translation.copy()
    turn = Matrix.Translation(pivot) @ Matrix.Rotation(-pitch * size["level"], 4, side.normalized()) @ Matrix.Translation(-pivot)
    head.matrix = rig.matrix_world.inverted() @ turn @ world_head
    bpy.context.view_layer.update()
    print('head levelled by %.1f degrees' % math.degrees(pitch * size['level']))

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


Maker(scene, ctrl, (across, up, through, back, up_sign), place, size, scale).pair(frames, bridge, hinges, m, depth_back, ink)

# The studio: its ground, its lights, and the two pictures.
face = ctrl.matrix_world.translation.copy()
facing = Vector((0.0, 0.0, 0.0))
facing[through] = -back
toward = ctrl.matrix_world.to_3x3() @ facing
toward.z = 0
toward.normalize()
studio.ground(scene, size, ink)
studio.lights(scene, face, toward, size)
studio.render(scene, face, toward, size, args.size, args.samples, ART)
if args.save:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(os.path.join(ART, 'glasses-on.blend')), copy=True)
    print('saved', os.path.join(ART, 'glasses-on.blend'))
