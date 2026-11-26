require 'json'

TARGET_BASENAME = '0916_크랭크샤프트 샤워실.skp'.freeze
REPORT_PATH = File.join(__dir__, 'model_report.json').freeze

def mm(v)
  (v.to_f * 25.4).round(1)
end

def entity_record(entity)
  box = entity.bounds
  record = {
    type: entity.typename,
    name: (entity.respond_to?(:name) ? entity.name.to_s : ''),
    tag: (entity.respond_to?(:layer) && entity.layer ? entity.layer.name.to_s : ''),
    material: (entity.respond_to?(:material) && entity.material ? entity.material.display_name.to_s : ''),
    bbox_mm: {
      min: [mm(box.min.x), mm(box.min.y), mm(box.min.z)],
      max: [mm(box.max.x), mm(box.max.y), mm(box.max.z)],
      size: [mm(box.width), mm(box.depth), mm(box.height)]
    }
  }
  if entity.is_a?(Sketchup::ComponentInstance)
    record[:definition] = entity.definition.name.to_s
    record[:child_count] = entity.definition.entities.length
  elsif entity.is_a?(Sketchup::Group)
    record[:child_count] = entity.entities.length
  end
  record
end

attempts = 0
timer = nil
timer = UI.start_timer(1.0, true) do
  attempts += 1
  model = Sketchup.active_model
  next if model.path.empty? || File.basename(model.path) != TARGET_BASENAME

  UI.stop_timer(timer)
  data = {
    path: model.path,
    title: model.title,
    description: model.description,
    bounds_mm: {
      min: [mm(model.bounds.min.x), mm(model.bounds.min.y), mm(model.bounds.min.z)],
      max: [mm(model.bounds.max.x), mm(model.bounds.max.y), mm(model.bounds.max.z)]
    },
    tags: model.layers.map { |layer| { name: layer.name, visible: layer.visible? } },
    materials: model.materials.map { |m| { name: m.display_name, color: m.color.to_a, alpha: m.alpha } },
    entities: model.entities.map { |e| entity_record(e) }
  }
  File.write(REPORT_PATH, JSON.pretty_generate(data))
  Sketchup.quit
end

