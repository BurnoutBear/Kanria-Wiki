extends Control

@onready var entry_name : Label = $VBox/Name
@onready var entry_desc : TextEdit = $VBox/Description
@onready var save : Button = $VBox/HBox/Save
@onready var cancel : Button = $VBox/HBox/Cancel
var old_desc : String
var editing : bool

func _ready():
	editing = false
	save.visible = false
	cancel.visible = false

func TextChanged():
	if !editing:
		editing = true
		save.visible = true
		cancel.visible = true

func SaveChanges():
	editing = false
	save.visible = false
	cancel.visible = false
	if entry_desc.text != old_desc:
		old_desc = entry_desc.text
		## TODO store changes to DB

func CancelChanges():
	editing = false
	save.visible = false
	cancel.visible = false
	entry_desc.text = old_desc
