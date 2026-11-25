"""The pieces of Phiegg's glasses made solid in Blender, each hung from an empty (scripts/glasses_on.py puts them on
the mannequin): acetate frames, bridge, hinges and temple tips; glass lenses; gold temples swept back along the head
with the photographed pair's diamond knurl; gold studs on the frames' front corners. Sizes are art/glasses.tsv's."""
import math

import bpy
import bmesh  # noqa: E402 (Blender's module makes bmesh known)
from mathutils import Matrix, Vector


def material(name, colour, **kind):
    """A Principled material of a colour (#rrggbb) and the settings given by their input's name."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes['Principled BSDF']
    c = tuple(int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    p.inputs['Base Color'].default_value = (*[v ** 2.2 for v in c], 1.0)
    for key, value in kind.items():
        p.inputs[key].default_value = value
    return mat


class Maker:
    """What makes the pieces: the scene, the empty they hang from, the empty's axes (the index of across, up and
    through, and which way is back and which up), where a point of the drawing stands in the empty's space, the
    table's sizes, and how many metres a pixel of the drawing is."""

    def __init__(self, scene, ctrl, axes, place, size, scale):
        self.scene, self.ctrl, self.place, self.size, self.scale = scene, ctrl, place, size, scale
        self.across, self.up, self.through, self.back, self.up_sign = axes

    def axis(self, index, sign=1.0):
        v = Vector((0.0, 0.0, 0.0))
        v[index] = sign
        return v

    def knurl(self, mat):
        """The temples' diamond knurl, as on the pair: two fine ridges crossing, as a bump on the gold."""
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        coord = nodes.new('ShaderNodeTexCoord')
        ridges = []
        for turn in (45.0, -45.0):
            spin = nodes.new('ShaderNodeMapping')
            spin.inputs['Rotation'].default_value = (0.0, 0.0, math.radians(turn))
            links.new(coord.outputs['Object'], spin.inputs['Vector'])
            wave = nodes.new('ShaderNodeTexWave')
            wave.inputs['Scale'].default_value = self.size['knurl']
            links.new(spin.outputs['Vector'], wave.inputs['Vector'])
            ridges.append(wave)
        both = nodes.new('ShaderNodeMath')
        both.operation = 'MULTIPLY'
        links.new(ridges[0].outputs['Fac'], both.inputs[0])
        links.new(ridges[1].outputs['Fac'], both.inputs[1])
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.35
        links.new(both.outputs['Value'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], nodes['Principled BSDF'].inputs['Normal'])

    def hang(self, name, mesh, mat):
        ob = bpy.data.objects.new(name, mesh)
        ob.data.materials.append(mat)
        self.scene.collection.objects.link(ob)
        ob.parent = self.ctrl
        ob.matrix_parent_inverse = Matrix.Identity(4)
        return ob

    def solid(self, name, loops, thick, mat, bevel=0.0):
        """A solid from closed outlines (a hole where one stands inside another), as deep as `thick`."""
        bm = bmesh.new()
        edges = []
        for loop in loops:
            verts = [bm.verts.new(self.place(x, y, 0.0)) for x, y in loop]
            edges += [bm.edges.new((verts[i], verts[(i + 1) % len(verts)])) for i in range(len(verts))]
        bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=True, edges=edges)
        grown = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        bmesh.ops.translate(bm, vec=self.axis(self.through, self.back) * thick, verts=[g for g in grown['geom'] if isinstance(g, bmesh.types.BMVert)])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        mesh = bpy.data.meshes.new(name)
        bm.to_mesh(mesh)
        bm.free()
        ob = self.hang(name, mesh, mat)
        if bevel:
            mod = ob.modifiers.new('round', 'BEVEL')
            mod.width, mod.segments, mod.limit_method = bevel, 5, 'ANGLE'
            mod.harden_normals = True
            for poly in mesh.polygons:
                poly.use_smooth = True
        return ob

    def sweep(self, name, path, wide, high, mat):
        """A flat bar along a path of points in the empty's space: `wide` across the head, `high` up it, tapering
        to `taper.tip` of that height at its end; capped at both ends."""
        bm = bmesh.new()
        a, u = self.axis(self.across), self.axis(self.up, self.up_sign)
        rings = []
        for n, p in enumerate(path):
            f = n / max(len(path) - 1, 1)
            h = high * (1 - (1 - self.size['taper.tip']) * f) / 2
            rings.append([bm.verts.new(p + a * dx + u * dy) for dx, dy in ((-wide / 2, -h), (wide / 2, -h), (wide / 2, h), (-wide / 2, h))])
        for one, two in zip(rings, rings[1:]):
            for i in range(4):
                bm.faces.new((one[i], one[(i + 1) % 4], two[(i + 1) % 4], two[i]))
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        mesh = bpy.data.meshes.new(name)
        bm.to_mesh(mesh)
        bm.free()
        for poly in mesh.polygons:
            poly.use_smooth = True
        return self.hang(name, mesh, mat)

    def pair(self, frames, bridge, hinges, m, run, ink):
        """Every piece: frames and bridge, lenses, hinges, temples running `run` metres back, studs."""
        size, scale, place = self.size, self.scale, self.place
        # Black acetate, polished: a clear coat catches the light along its rounded edges, its face stays black.
        acetate = material('phi-acetate', ink['acetate'], **{'Roughness': 0.32, 'Specular IOR Level': 0.4, 'Coat Weight': 0.15, 'Coat Roughness': 0.12})
        metal = material('phi-gold', ink['metal'], **{'Metallic': 1.0, 'Roughness': 0.26})
        self.knurl(metal)
        # The lenses as the pair's: clear, with the faint blue and violet an anti-glare coat throws back.
        glass = material('phi-lens', ink['glass'], **{'Transmission Weight': 1.0, 'Roughness': 0.02, 'IOR': 1.5, 'Thin Film Thickness': size['coat'], 'Thin Film IOR': 1.38})
        self.solid('phi-frames', [loop for pair in frames for loop in pair], size['depth'], acetate, size['bevel'])
        self.solid('phi-bridge', [bridge], size['depth'] * 0.85, acetate, size['bevel'])
        for n, (_, counter) in enumerate(frames):
            lens = self.solid('phi-lens-%d' % n, [counter], size['lens.depth'], glass)
            lens.location[self.through] += self.back * (size['depth'] - size['lens.depth']) / 2
        # Hinges; the temples from them back along the head as far as the pair's own run, splaying a little and
        # bending down behind the ear, the last of them black acetate as the pair's tips are.
        back, down = self.axis(self.through, self.back), self.axis(self.up, -self.up_sign)
        bend, steps = run * size['bend'], 40
        for n, (x, y, w, h, side) in enumerate(hinges):
            self.solid('phi-hinge-%d' % n, [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]], size['depth'], acetate, size['bevel'] / 2)
            sign = 1 if side == 'right' else -1
            out = self.axis(self.across, sign)
            start = place((x if side == 'left' else x + w) - sign * size['temple'] / scale / 2, y + h / 2, size['depth'] * 0.5)
            path = []
            for i in range(steps + 1):
                d = run * i / steps
                drop = max(0.0, d - bend)
                path.append(start + back * d + out * d * math.tan(math.radians(size['splay'])) + down * (drop * drop / (run - bend) * math.tan(math.radians(size['drop']))))
            cut = int(steps * size['tip.from'])
            self.sweep('phi-temple-%d' % n, path[:cut + 1], size['temple'], size['temple.high'], metal)
            self.sweep('phi-tip-%d' % n, path[cut:], size['temple'] * 1.6, size['temple.high'] * 0.8, acetate)
        # Gold studs on the frames' front corners, as the pair's.
        s = m['s']
        w, h = size['stud'] / scale, size['stud.high'] / scale
        for n, (outer, _) in enumerate(frames):
            x = min(p[0] for p in outer) + s * 0.45 if n == 0 else max(p[0] for p in outer) - s * 0.45
            y = min(p[1] for p in outer) + s * 0.5
            stud = self.solid('phi-stud-%d' % n, [[(x - w / 2, y), (x + w / 2, y), (x + w / 2, y + h), (x - w / 2, y + h)]], size['stud.depth'], metal, size['stud.depth'] / 3)
            stud.location[self.through] -= self.back * size['stud.depth'] * 0.6
