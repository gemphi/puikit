"""The studio Phiegg's glasses are shot in on the mannequin (scripts/glasses_on.py): the ground, bright to the camera
as Apple's pages stand a product and faint as light so black stays black; a key high and to the side, as black
frames are lit for a picture, a fill opposite, a rim behind; cameras at the face and at a three-quarter turn; and
Cycles, on the graphics card where Blender can load its kernels, else the processor. Amounts are art/glasses.tsv's."""
import math
import os

import bpy
from mathutils import Vector


def ground(scene, size, ink):
    """The world: the studio's colour, bright where the camera sees it, faint as light on the head."""
    world = scene.world or bpy.data.worlds.new('studio')
    scene.world = world
    world.use_nodes = True
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


def lights(scene, face, toward, size):
    """The key high and to the side, so the frames' faces stay black and the light runs along their rounded edges,
    never where they mirror the camera's view; the fill opposite; the rim behind."""
    side = Vector((-toward.y, toward.x, 0))

    def light(name, power, offset, across):
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.shape, data.size = power, 'DISK', across
        ob = bpy.data.objects.new(name, data)
        scene.collection.objects.link(ob)
        ob.location = face + offset
        ob.rotation_euler = (face - ob.location).to_track_quat('-Z', 'Y').to_euler()

    light('key', size['key'], toward * 0.45 + side * 0.85 + Vector((0, 0, 1.3)), 1.2)
    light('fill', size['fill'], toward * 0.6 - side * 0.9 + Vector((0, 0, -0.3)), 1.5)
    light('rim', size['rim'], -toward * 1.0 + side * 0.6 + Vector((0, 0, 0.6)), 1.0)


def camera(scene, name, face, toward, turn, size):
    """A camera before the face, turned about it by so many degrees, looking a little under its middle."""
    data = bpy.data.cameras.new(name)
    data.lens = size['focal']
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    a = math.radians(turn)
    way = Vector((toward.x * math.cos(a) - toward.y * math.sin(a), toward.x * math.sin(a) + toward.y * math.cos(a), 0))
    ob.location = face + way * size['distance'] + Vector((0, 0, -0.02))
    ob.rotation_euler = (face + Vector((0, 0, -0.06)) - ob.location).to_track_quat('-Z', 'Y').to_euler()
    return ob


def render(scene, face, toward, size, pixels, samples, folder):
    """Render the face and the three-quarter turn, square, into the folder."""
    scene.render.resolution_x = scene.render.resolution_y = pixels
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    # Cycles: EEVEE run without a window draws materials made by a script before their shaders are ready, white.
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
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
        scene.camera = camera(scene, 'glasses-' + name, face, toward, turn, size)
        scene.render.filepath = os.path.abspath(os.path.join(folder, 'glasses-on-%s.png' % name))
        try:
            bpy.ops.render.render(write_still=True)
        except RuntimeError as why:
            # A card whose kernels this Blender cannot load: the processor renders it.
            print('on the processor, the card refused:', str(why).splitlines()[0][:120])
            scene.cycles.device = 'CPU'
            bpy.ops.render.render(write_still=True)
        print('rendered', scene.render.filepath)
