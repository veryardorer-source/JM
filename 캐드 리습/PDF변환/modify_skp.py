import ctypes as c
import json
import os
from pathlib import Path

DLL_DIR = Path(r"C:\Program Files\SketchUp\SketchUp 2024")
SOURCE = Path(r"C:\Users\User\Desktop\001_JM디자인\SynologyDrive\2026.08.26_크랭크샤프트 샤워장\004_3D도면\0916_크랭크샤프트 샤워실.skp")
OUTPUT = Path(__file__).with_name("0916_크랭크샤프트 샤워실_수정본.skp")
LOG = Path(__file__).with_name("modify_log.json")

os.add_dll_directory(str(DLL_DIR))
api = c.CDLL(str(DLL_DIR / "SketchUpAPI.dll"))

class Ref(c.Structure):
    _fields_ = [("ptr", c.c_void_p)]

class Point3D(c.Structure):
    _fields_ = [("x", c.c_double), ("y", c.c_double), ("z", c.c_double)]

class BoundingBox3D(c.Structure):
    _fields_ = [("min_point", Point3D), ("max_point", Point3D)]

class Transformation(c.Structure):
    _fields_ = [("values", c.c_double * 16)]

class Color(c.Structure):
    _fields_ = [("red", c.c_ubyte), ("green", c.c_ubyte), ("blue", c.c_ubyte), ("alpha", c.c_ubyte)]

def fn(name, args, restype=c.c_int):
    f = getattr(api, name)
    f.argtypes = args
    f.restype = restype
    return f

SUInitialize = fn("SUInitialize", [], None)
SUTerminate = fn("SUTerminate", [], None)
SUModelCreateFromFileWithStatus = fn("SUModelCreateFromFileWithStatus", [c.POINTER(Ref), c.c_char_p, c.POINTER(c.c_int)])
SUModelRelease = fn("SUModelRelease", [c.POINTER(Ref)])
SUModelSaveToFile = fn("SUModelSaveToFile", [Ref, c.c_char_p])
SUModelGetEntities = fn("SUModelGetEntities", [Ref, c.POINTER(Ref)])
SUModelAddMaterials = fn("SUModelAddMaterials", [Ref, c.c_size_t, c.POINTER(Ref)])

SUEntitiesGetNumGroups = fn("SUEntitiesGetNumGroups", [Ref, c.POINTER(c.c_size_t)])
SUEntitiesGetGroups = fn("SUEntitiesGetGroups", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SUEntitiesGetNumInstances = fn("SUEntitiesGetNumInstances", [Ref, c.POINTER(c.c_size_t)])
SUEntitiesGetInstances = fn("SUEntitiesGetInstances", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SUEntitiesGetNumFaces = fn("SUEntitiesGetNumFaces", [Ref, c.POINTER(c.c_size_t)])
SUEntitiesGetFaces = fn("SUEntitiesGetFaces", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SUEntitiesErase = fn("SUEntitiesErase", [Ref, c.c_size_t, c.POINTER(Ref)])
SUEntitiesTransform = fn("SUEntitiesTransform", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(Transformation)])
SUEntitiesAddGroup = fn("SUEntitiesAddGroup", [Ref, Ref])
SUEntitiesAddInstance = fn("SUEntitiesAddInstance", [Ref, Ref, c.c_void_p])
SUEntitiesFill = fn("SUEntitiesFill", [Ref, Ref, c.c_bool])

SUStringCreate = fn("SUStringCreate", [c.POINTER(Ref)])
SUStringRelease = fn("SUStringRelease", [c.POINTER(Ref)])
SUStringGetUTF8Length = fn("SUStringGetUTF8Length", [Ref, c.POINTER(c.c_size_t)])
SUStringGetUTF8 = fn("SUStringGetUTF8", [Ref, c.c_size_t, c.c_char_p, c.POINTER(c.c_size_t)])

SUGroupCreate = fn("SUGroupCreate", [c.POINTER(Ref)])
SUGroupSetName = fn("SUGroupSetName", [Ref, c.c_char_p])
SUGroupGetName = fn("SUGroupGetName", [Ref, c.POINTER(Ref)])
SUGroupGetEntities = fn("SUGroupGetEntities", [Ref, c.POINTER(Ref)])
SUGroupToEntity = fn("SUGroupToEntity", [Ref], Ref)
SUGroupToDrawingElement = fn("SUGroupToDrawingElement", [Ref], Ref)

SUComponentInstanceGetName = fn("SUComponentInstanceGetName", [Ref, c.POINTER(Ref)])
SUComponentInstanceSetName = fn("SUComponentInstanceSetName", [Ref, c.c_char_p])
SUComponentInstanceGetDefinition = fn("SUComponentInstanceGetDefinition", [Ref, c.POINTER(Ref)])
SUComponentInstanceToEntity = fn("SUComponentInstanceToEntity", [Ref], Ref)
SUComponentInstanceToDrawingElement = fn("SUComponentInstanceToDrawingElement", [Ref], Ref)
SUComponentInstanceSetTransform = fn("SUComponentInstanceSetTransform", [Ref, c.POINTER(Transformation)])
SUComponentDefinitionGetName = fn("SUComponentDefinitionGetName", [Ref, c.POINTER(Ref)])
SUComponentDefinitionCreateInstance = fn("SUComponentDefinitionCreateInstance", [Ref, c.POINTER(Ref)])

SUDrawingElementGetBoundingBox = fn("SUDrawingElementGetBoundingBox", [Ref, c.POINTER(BoundingBox3D)])
SUFaceSetFrontMaterial = fn("SUFaceSetFrontMaterial", [Ref, Ref])
SUFaceSetBackMaterial = fn("SUFaceSetBackMaterial", [Ref, Ref])

SUMaterialCreate = fn("SUMaterialCreate", [c.POINTER(Ref)])
SUMaterialSetName = fn("SUMaterialSetName", [Ref, c.c_char_p])
SUMaterialSetColor = fn("SUMaterialSetColor", [Ref, c.POINTER(Color)])
SUMaterialSetUseOpacity = fn("SUMaterialSetUseOpacity", [Ref, c.c_bool])

SUGeometryInputCreate = fn("SUGeometryInputCreate", [c.POINTER(Ref)])
SUGeometryInputRelease = fn("SUGeometryInputRelease", [c.POINTER(Ref)])
SUGeometryInputAddVertex = fn("SUGeometryInputAddVertex", [Ref, c.POINTER(Point3D)])
SUGeometryInputAddFace = fn("SUGeometryInputAddFace", [Ref, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SULoopInputCreate = fn("SULoopInputCreate", [c.POINTER(Ref)])
SULoopInputAddVertexIndex = fn("SULoopInputAddVertexIndex", [Ref, c.c_size_t])

MM = 1.0 / 25.4

def check(code, label):
    if code != 0:
        raise RuntimeError(f"{label}: SUResult={code}")

def utf8(text):
    return text.encode("utf-8")

def read_string(getter, ref):
    s = Ref()
    check(SUStringCreate(c.byref(s)), "SUStringCreate")
    try:
        check(getter(ref, c.byref(s)), getter.__name__)
        n = c.c_size_t()
        check(SUStringGetUTF8Length(s, c.byref(n)), "SUStringGetUTF8Length")
        buf = c.create_string_buffer(n.value + 1)
        out = c.c_size_t()
        check(SUStringGetUTF8(s, len(buf), buf, c.byref(out)), "SUStringGetUTF8")
        return buf.value.decode("utf-8", errors="replace")
    finally:
        SUStringRelease(c.byref(s))

def get_refs(entities, count_fn, get_fn):
    n = c.c_size_t()
    check(count_fn(entities, c.byref(n)), count_fn.__name__)
    if not n.value:
        return []
    arr = (Ref * n.value)()
    got = c.c_size_t()
    check(get_fn(entities, n.value, arr, c.byref(got)), get_fn.__name__)
    return list(arr[:got.value])

def bbox_mm(drawing):
    b = BoundingBox3D()
    check(SUDrawingElementGetBoundingBox(drawing, c.byref(b)), "bounding box")
    conv = lambda p: [p.x * 25.4, p.y * 25.4, p.z * 25.4]
    return conv(b.min_point), conv(b.max_point)

def transform(tx=0, ty=0, tz=0, rot180=False):
    vals = [0.0] * 16
    vals[0] = -1.0 if rot180 else 1.0
    vals[5] = -1.0 if rot180 else 1.0
    vals[10] = 1.0
    vals[12], vals[13], vals[14], vals[15] = tx * MM, ty * MM, tz * MM, 1.0
    return Transformation((c.c_double * 16)(*vals))

def custom_transform(values):
    return Transformation((c.c_double * 16)(*values))

def erase(root, refs):
    if not refs:
        return 0
    arr = (Ref * len(refs))(*refs)
    check(SUEntitiesErase(root, len(refs), arr), "erase entities")
    return len(refs)

def move_entity(root, entity_ref, dx, dy, dz=0):
    arr = (Ref * 1)(entity_ref)
    t = transform(dx, dy, dz)
    check(SUEntitiesTransform(root, 1, arr, c.byref(t)), "move entity")

def create_material(model, name, rgb):
    material = Ref()
    check(SUMaterialCreate(c.byref(material)), "material create")
    check(SUMaterialSetName(material, utf8(name)), "material name")
    color = Color(rgb[0], rgb[1], rgb[2], 255)
    check(SUMaterialSetColor(material, c.byref(color)), "material color")
    check(SUMaterialSetUseOpacity(material, False), "material opacity")
    arr = (Ref * 1)(material)
    check(SUModelAddMaterials(model, 1, arr), "add material")
    return material

def add_box_to_geometry(geom, box):
    x0, y0, z0, x1, y1, z1 = [v * MM for v in box]
    pts = [
        Point3D(x0,y0,z0), Point3D(x1,y0,z0), Point3D(x1,y1,z0), Point3D(x0,y1,z0),
        Point3D(x0,y0,z1), Point3D(x1,y0,z1), Point3D(x1,y1,z1), Point3D(x0,y1,z1),
    ]
    base = add_box_to_geometry.vertex_count
    for p in pts:
        check(SUGeometryInputAddVertex(geom, c.byref(p)), "add vertex")
    add_box_to_geometry.vertex_count += 8
    faces = [
        (0,3,2,1), (4,5,6,7), (0,1,5,4),
        (1,2,6,5), (2,3,7,6), (3,0,4,7)
    ]
    for face in faces:
        loop = Ref()
        check(SULoopInputCreate(c.byref(loop)), "loop create")
        for idx in face:
            check(SULoopInputAddVertexIndex(loop, base + idx), "loop vertex")
        face_index = c.c_size_t()
        check(SUGeometryInputAddFace(geom, c.byref(loop), c.byref(face_index)), "add face")

add_box_to_geometry.vertex_count = 0

def create_group_with_boxes(root, name, boxes, material):
    group = Ref()
    check(SUGroupCreate(c.byref(group)), "group create")
    check(SUEntitiesAddGroup(root, group), "add group")
    check(SUGroupSetName(group, utf8(name)), "group name")
    group_entities = Ref()
    check(SUGroupGetEntities(group, c.byref(group_entities)), "group entities")
    geom = Ref()
    check(SUGeometryInputCreate(c.byref(geom)), "geometry create")
    add_box_to_geometry.vertex_count = 0
    try:
        for box in boxes:
            add_box_to_geometry(geom, box)
        check(SUEntitiesFill(group_entities, geom, True), "geometry fill")
    finally:
        SUGeometryInputRelease(c.byref(geom))
    faces = get_refs(group_entities, SUEntitiesGetNumFaces, SUEntitiesGetFaces)
    for face in faces:
        check(SUFaceSetFrontMaterial(face, material), "front material")
        check(SUFaceSetBackMaterial(face, material), "back material")
    return group, len(faces)

def tiled_boxes(x0, y0, x1, y1, sx, sy, z0, z1, gap):
    boxes = []
    x = x0
    while x < x1 - 0.01:
        nx = min(x + sx, x1)
        y = y0
        while y < y1 - 0.01:
            ny = min(y + sy, y1)
            gx = min(gap / 2.0, max(0.0, (nx - x) / 4.0))
            gy = min(gap / 2.0, max(0.0, (ny - y) / 4.0))
            boxes.append((x + gx, y + gy, z0, nx - gx, ny - gy, z1))
            y = ny
        x = nx
    return boxes

def create_instance(root, definition, name, t):
    inst = Ref()
    check(SUComponentDefinitionCreateInstance(definition, c.byref(inst)), "create instance")
    check(SUComponentInstanceSetTransform(inst, c.byref(t)), "instance transform")
    check(SUComponentInstanceSetName(inst, utf8(name)), "instance name")
    check(SUEntitiesAddInstance(root, inst, None), "add instance")
    return inst

def main():
    log = {"source": str(SOURCE), "output": str(OUTPUT)}
    SUInitialize()
    model = Ref()
    try:
        status = c.c_int()
        check(SUModelCreateFromFileWithStatus(c.byref(model), utf8(str(SOURCE)), c.byref(status)), "load model")
        log["load_status"] = status.value
        root = Ref()
        check(SUModelGetEntities(model, c.byref(root)), "root entities")

        groups = get_refs(root, SUEntitiesGetNumGroups, SUEntitiesGetGroups)
        instances = get_refs(root, SUEntitiesGetNumInstances, SUEntitiesGetInstances)

        reference_4000 = None
        reference_2000 = None
        shower_partitions = []
        obsolete_finish_groups = []
        for g in groups:
            name = read_string(SUGroupGetName, g)
            bmin, bmax = bbox_mm(SUGroupToDrawingElement(g))
            size = [bmax[i] - bmin[i] for i in range(3)]
            if name.startswith("샤워칸막이 "):
                shower_partitions.append(SUGroupToEntity(g))
            if name in ("샤워실 PVC 천장 300x300 H2600", "탈의실_HDG738_450x450"):
                obsolete_finish_groups.append(SUGroupToEntity(g))
            if not name and bmin[0] > 18000 and abs(size[0] - 4000) < 5 and abs(size[1] - 600) < 5:
                reference_4000 = (g, bmin)
            if not name and bmin[0] > 18000 and abs(size[0] - 2000) < 5 and abs(size[1] - 600) < 5:
                reference_2000 = (g, bmin)

        old_furniture = []
        far_reference_instances = []
        locker_definition = None
        lock_definition = None
        for inst in instances:
            name = read_string(SUComponentInstanceGetName, inst)
            definition = Ref()
            check(SUComponentInstanceGetDefinition(inst, c.byref(definition)), "get definition")
            def_name = read_string(SUComponentDefinitionGetName, definition)
            bmin, _ = bbox_mm(SUComponentInstanceToDrawingElement(inst))
            if def_name == "옷장_사진형태_단일문_309x550x1800" or name.startswith("수건장_") or name.startswith("거울장_"):
                old_furniture.append(SUComponentInstanceToEntity(inst))
            if def_name == "옷장_사진형태_단일문_309x550x#1":
                locker_definition = definition
            if def_name == "DOOR+LOCK":
                lock_definition = definition
            if bmin[0] > 18000:
                far_reference_instances.append(SUComponentInstanceToEntity(inst))

        log["removed_shower_partitions"] = erase(root, shower_partitions)
        log["removed_old_furniture"] = erase(root, old_furniture)
        log["removed_old_finishes"] = erase(root, obsolete_finish_groups)

        if reference_4000 is None or reference_2000 is None or locker_definition is None:
            raise RuntimeError("Reference furniture geometry was not found in the source model")

        g4000, min4000 = reference_4000
        move_entity(root, SUGroupToEntity(g4000), 9854.7 - min4000[0], 7700.0 - min4000[1], -min4000[2])
        check(SUGroupSetName(g4000, utf8("제작가구_거울하부장_4000x600x1800_이미지참조")), "rename 4000 cabinet")
        g2000, min2000 = reference_2000
        move_entity(root, SUGroupToEntity(g2000), 5900.0 - min2000[0], 3500.0 - min2000[1], -min2000[2])
        check(SUGroupSetName(g2000, utf8("제작가구_수건장_2000x600x2000_이미지참조")), "rename 2000 cabinet")

        # Replace the old 309 mm lockers with 64 copies of the 300x550x1800 reference locker.
        locker_rows = [(4650.0, False), (2050.0, False), (2600.0, True), (0.0, True)]
        locker_count = 0
        lock_count = 0
        for row_index, (y, reversed_row) in enumerate(locker_rows):
            for i in range(16):
                x = 10000.0 + 300.0 * i
                if reversed_row:
                    body_t = transform(x + 300.0, y + 550.0, 0, True)
                else:
                    body_t = transform(x, y, 0, False)
                locker_count += 1
                create_instance(root, locker_definition, f"제작가구 옷장 {locker_count:02d}_300x550x1800", body_t)
                if lock_definition.ptr:
                    if reversed_row:
                        vals = [0.0,1.0,0.0,0.0,-1.0,0.0,0.0,0.0,0.0,0.0,1.0,0.0,(x+250.235)*MM,(y+552.302)*MM,1009.66*MM,1.0]
                    else:
                        vals = [0.0,-1.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,0.0,1.0,0.0,(x+49.765)*MM,(y-2.302)*MM,1009.66*MM,1.0]
                    create_instance(root, lock_definition, f"옷장 도어락 {locker_count:02d}", custom_transform(vals))
                    lock_count += 1
        log["new_lockers"] = locker_count
        log["new_locker_handles"] = lock_count

        # Remove only the remaining far-away reference annotations/instances; the two furniture groups were moved into place.
        log["removed_reference_annotations"] = erase(root, far_reference_instances)

        ivory = create_material(model, "ENS_Wallpaper_Shinhan_Ivory_Matte", (235, 229, 211))
        deco = create_material(model, "ENS_DecoTile_600x600_WarmGray_Matte", (184, 181, 174))
        grout = create_material(model, "ENS_Grout_WarmGray_Dark", (118, 116, 112))
        pvc = create_material(model, "ENS_Ceiling_PVC_White_300x300_Satin", (247, 247, 244))
        tex = create_material(model, "ENS_Ceiling_Tex_White_300x600_Matte", (238, 238, 232))

        # Dressing-room wallpaper finish skins (2 mm) on all visible interior wall runs.
        wall_boxes = [
            (14798, 0, 0, 14800, 8300, 2600),
            (8000, 0, 0, 14800, 2, 2600),
            (8630, 8298, 0, 14800, 8300, 2600),
            (5900, 8298, 0, 6970, 8300, 2600),
            (5898, 0, 0, 5900, 4230, 2600),
            (5898, 5070, 0, 5900, 8300, 2600),
            (7998, 0, 0, 8000, 3400, 2600),
            (5900, 3498, 0, 8000, 3500, 2600),
        ]
        _, wall_faces = create_group_with_boxes(root, "탈의실_신한아이보리_도배마감_ENS", wall_boxes, ivory)
        log["wall_finish_faces"] = wall_faces

        # 600x600 dressing-room decorative floor tile with 3 mm recessed grout.
        create_group_with_boxes(root, "탈의실_데코타일_줄눈바탕_ENS", [(5900, 0, 3.2, 14800, 8300, 3.8)], grout)
        floor_boxes = tiled_boxes(5900, 0, 14800, 8300, 600, 600, 3.8, 7.8, 3.0)
        _, floor_faces = create_group_with_boxes(root, "탈의실_데코타일_600x600_ENS", floor_boxes, deco)
        log["dressing_floor_panels"] = len(floor_boxes)
        log["dressing_floor_faces"] = floor_faces

        # 300x300 white plastic shower ceiling with small panel joints.
        create_group_with_boxes(root, "샤워실_PVC천장_줄눈바탕_ENS", [(0, 0, 2598, 5800, 8300, 2600)], pvc)
        shower_ceiling_boxes = tiled_boxes(0, 0, 5800, 8300, 300, 300, 2586, 2598, 2.0)
        _, shower_faces = create_group_with_boxes(root, "샤워실_PVC천장_300x300_화이트플라스틱_ENS", shower_ceiling_boxes, pvc)
        log["shower_ceiling_panels"] = len(shower_ceiling_boxes)
        log["shower_ceiling_faces"] = shower_faces

        # 300x600 acoustic tex ceiling in the dressing-room zone.
        create_group_with_boxes(root, "탈의실_텍스천장_줄눈바탕_ENS", [(5900, 0, 2598, 14800, 8300, 2600)], tex)
        tex_boxes = tiled_boxes(5900, 0, 14800, 8300, 600, 300, 2586, 2598, 2.0)
        _, tex_faces = create_group_with_boxes(root, "탈의실_텍스천장_300x600_ENS", tex_boxes, tex)
        log["dressing_ceiling_panels"] = len(tex_boxes)
        log["dressing_ceiling_faces"] = tex_faces

        check(SUModelSaveToFile(model, utf8(str(OUTPUT))), "save model")
        log["saved"] = True
        LOG.write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    finally:
        if model.ptr:
            SUModelRelease(c.byref(model))
        SUTerminate()

if __name__ == "__main__":
    main()
