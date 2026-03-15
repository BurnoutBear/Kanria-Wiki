extends Control

@onready var category_list : VBoxContainer = $All/Zones/Center/Zones/Left/Margin/Navigation/Body/Margin/List
@onready var category_displayer : MarginContainer = $All/Zones/Center/Zones/Middle/Margin

var wiki_entry
@export var entry_number : int = 6

func _ready():
	wiki_entry = load("res://wiki_entry.tscn")
	PopulateCategories()

func PopulateCategories():
	## Remove "Eg Cat Page" (used to visualize how the wiki is populated)
	category_displayer.get_child(0).queue_free()
	
	## Populate categories w/ DB entries (see "Eg Cat Page" for example structure)
	for group in category_list.get_children():
		for category in group.get_children():
			var page : ScrollContainer = ScrollContainer.new()
			category_displayer.add_child(page)
			page.name = category.text + " Page"
			page.visible = false
			var list : VBoxContainer = VBoxContainer.new()
			page.add_child(list)
			list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			list.name = "List"
			var refs : VBoxContainer = VBoxContainer.new()
			list.add_child(refs)
			#refs.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			refs.name = "Refs"
			var category_name : Label = Label.new()
			refs.add_child(category_name)
			category_name.text = category.text + "\n"
			for i in entry_number:
				## Add refs
				var ref : LinkButton = LinkButton.new()
				refs.add_child(ref)
				ref.text = "Entry Name" + " " + category_name.text + " " + str(i)
				ref.pressed.connect(ShowEntry.bind(ref.text))
				## Add entries
				var entry = wiki_entry.instantiate()
				list.add_child(entry)
				entry.name = "Entry Name" + " " + category_name.text + " " + str(i)
				entry.entry_name.text = category.text
				entry.entry_desc.text = "Description subscription"
				#entry.size_flags_horizontal = Control.SIZE_EXPAND_FILL
				#entry.get_child(0).size_flags_horizontal = Control.SIZE_EXPAND_FILL

func ShowCategory(dir : String = "@"):
	var path : String = dir + " Page"
	if category_displayer.has_node(path):
		var list = category_displayer.get_node(path).get_child(0)
		var refs = category_displayer.get_node(path).get_child(0).get_child(0)
		## Hide pages except needed
		for page in category_displayer.get_children():
			page.visible = false
		category_displayer.get_node(path).visible = true
		## Hide all entries
		for entry in list.get_children():
			entry.visible = false
		## Show refs vbox & all refs
		refs.visible = true
		for ref in refs.get_children():
			ref.visible = true
	else:
		print(dir + " Category Empty")

func ShowEntry(entry_name : String):
	for page in category_displayer.get_children():
		if page.get_child(0).has_node(entry_name):
			var list = page.get_child(0)
			## Hide all
			for entry in list.get_children():
				entry.visible = false
			## Show entry
			list.get_node(entry_name).visible = true
			return
	print("Entry not found")
