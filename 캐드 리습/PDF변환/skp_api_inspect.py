import ctypes as c
import json
import os
import sys
from pathlib import Path

DLL_DIR = Path(r"C:\Program Files\SketchUp\SketchUp 2024")
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\Users\User\Desktop\001_JM디자인\SynologyDrive\2026.08.26_크랭크샤프트 샤워장\004_3D도면\0916_크랭크샤프트 샤워실.skp")
REPORT = Path(__file__).with_name("capi_report.json")

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

def fn(name, args, restype=c.c_int):
    f = getattr(api, name)
    f.argtypes = args
    f.restype = restype
    return f

SUInitialize = fn("SUInitialize", [], None)
SUTerminate = fn("SUTerminate", [], None)
SUModelCreateFromFileWithStatus = fn("SUModelCreateFromFileWithStatus", [c.POINTER(Ref), c.c_char_p, c.POINTER(c.c_int)])
SUModelRelease = fn("SUModelRelease", [c.POINTER(Ref)])
SUModelGetEntities = fn("SUModelGetEntities", [Ref, c.POINTER(Ref)])
SUModelGetNumMaterials = fn("SUModelGetNumMaterials", [Ref, c.POINTER(c.c_size_t)])
SUModelGetMaterials = fn("SUModelGetMaterials", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SUEntitiesGetNumGroups = fn("SUEntitiesGetNumGroups", [Ref, c.POINTER(c.c_size_t)])
SUEntitiesGetGroups = fn("SUEntitiesGetGroups", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SUEntitiesGetNumInstances = fn("SUEntitiesGetNumInstances", [Ref, c.POINTER(c.c_size_t)])
SUEntitiesGetInstances = fn("SUEntitiesGetInstances", [Ref, c.c_size_t, c.POINTER(Ref), c.POINTER(c.c_size_t)])
SUEntitiesGetNumFaces = fn("SUEntitiesGetNumFaces", [Ref, c.POINTER(c.c_size_t)])
SUEntitiesGetNumEdges = fn("SUEntitiesGetNumEdges", [Ref, c.c_bool, c.POINTER(c.c_size_t)])
SUGroupToDrawingElement = fn("SUGroupToDrawingElement", [Ref], Ref)
SUComponentInstanceToDrawingElement = fn("SUComponentInstanceToDrawingElement", [Ref], Ref)
SUDrawingElementGetBoundingBox = fn("SUDrawingElementGetBoundingBox", [Ref, c.POINTER(BoundingBox3D)])
SUStringCreate = fn("SUStringCreate", [c.POINTER(Ref)])
SUStringRelease = fn("SUStringRelease", [c.POINTER(Ref)])
SUStringGetUTF8Length = fn("SUStringGetUTF8Length", [Ref, c.POINTER(c.c_size_t)])
SUStringGetUTF8 = fn("SUStringGetUTF8", [Ref, c.c_size_t, c.c_char_p, c.POINTER(c.c_size_t)])
SUGroupGetName = fn("SUGroupGetName", [Ref, c.POINTER(Ref)])
SUComponentInstanceGetName = fn("SUComponentInstanceGetName", [Ref, c.POINTER(Ref)])
SUComponentInstanceGetDefinition = fn("SUComponentInstanceGetDefinition", [Ref, c.POINTER(Ref)])
SUComponentDefinitionGetName = fn("SUComponentDefinitionGetName", [Ref, c.POINTER(Ref)])
SUComponentInstanceGetTransform = fn("SUComponentInstanceGetTransform", [Ref, c.POINTER(Transformation)])
SUMaterialGetName = fn("SUMaterialGetName", [Ref, c.POINTER(Ref)])

def check(code, label):
    if code != 0:
        raise RuntimeError(f"{label}: SUResult={code}")

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

def bbox(drawing):
    b = BoundingBox3D()
    check(SUDrawingElementGetBoundingBox(drawing, c.byref(b)), "bbox")
    mm = lambda x: round(x * 25.4, 1)
    return {"min": [mm(b.min_point.x), mm(b.min_point.y), mm(b.min_point.z)], "max": [mm(b.max_point.x), mm(b.max_point.y), mm(b.max_point.z)]}

def get_refs(entities, count_fn, get_fn):
    n = c.c_size_t()
    check(count_fn(entities, c.byref(n)), count_fn.__name__)
    if not n.value:
        return []
    arr = (Ref * n.value)()
    got = c.c_size_t()
    check(get_fn(entities, n.value, arr, c.byref(got)), get_fn.__name__)
    return list(arr[:got.value])

def main():
    SUInitialize()
    model = Ref()
    try:
        status = c.c_int()
        check(SUModelCreateFromFileWithStatus(c.byref(model), str(SOURCE).encode("utf-8"), c.byref(status)), "load")
        ents = Ref()
        check(SUModelGetEntities(model, c.byref(ents)), "entities")
        faces = c.c_size_t(); edges = c.c_size_t()
        check(SUEntitiesGetNumFaces(ents, c.byref(faces)), "faces")
        check(SUEntitiesGetNumEdges(ents, False, c.byref(edges)), "edges")
        rows = []
        for g in get_refs(ents, SUEntitiesGetNumGroups, SUEntitiesGetGroups):
            rows.append({"type": "Group", "name": read_string(SUGroupGetName, g), "bbox_mm": bbox(SUGroupToDrawingElement(g))})
        for i in get_refs(ents, SUEntitiesGetNumInstances, SUEntitiesGetInstances):
            d = Ref(); check(SUComponentInstanceGetDefinition(i, c.byref(d)), "definition")
            t = Transformation(); check(SUComponentInstanceGetTransform(i, c.byref(t)), "transform")
            rows.append({"type": "Instance", "name": read_string(SUComponentInstanceGetName, i), "definition": read_string(SUComponentDefinitionGetName, d), "bbox_mm": bbox(SUComponentInstanceToDrawingElement(i)), "transform": [round(v, 8) for v in t.values]})
        mn = c.c_size_t(); check(SUModelGetNumMaterials(model, c.byref(mn)), "material count")
        mats = []
        if mn.value:
            marr = (Ref * mn.value)(); mgot = c.c_size_t()
            check(SUModelGetMaterials(model, mn.value, marr, c.byref(mgot)), "materials")
            mats = [read_string(SUMaterialGetName, m) for m in marr[:mgot.value]]
        REPORT.write_text(json.dumps({"load_status": status.value, "faces": faces.value, "edges": edges.value, "materials": mats, "entities": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    finally:
        if model.ptr:
            SUModelRelease(c.byref(model))
        SUTerminate()

if __name__ == "__main__":
    main()
