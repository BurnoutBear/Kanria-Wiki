extends Control

const basepath : String = "All/Zones/Center/Zones/Middle/Margin/"
@onready var category_list : VBoxContainer = $All/Zones/Center/Zones/Left/Margin/Navigation/Body/Margin/List
@onready var category_container : MarginContainer = $All/Zones/Center/Zones/Middle/Margin

var wiki_entry : PackedScene = null

func _ready():
	wiki_entry = load("res://wiki_entry.tscn")
	PopulateCategories()

func NavigationButtonPressed(dir : String = ""):
	print("[ "+ dir + " ]")
	if has_node(basepath + dir + " Page"):
		for child in get_node(basepath).get_children():
			child.visible = false
		get_node(basepath + dir + " Page").visible = true
	else:
		print("  Category Empty")

func PopulateCategories():
	for category in category_list.get_children():
		for li in category.get_children():
			var mc : MarginContainer = MarginContainer.new()
			mc.name = li.text + " Page"
			var vc : VBoxContainer = VBoxContainer.new()
			vc.name = "List"
			category_container.add_child(mc)
			mc.visible = false
			mc.add_child(vc)
			var we : MarginContainer = wiki_entry.instantiate()
			vc.add_child(we)
			print(mc.name)
			print(vc.get_path())
