extends Control

@onready var description : TextEdit = $VBox/Description
@onready var save : Button = $VBox/HBox/Save
@onready var cancel : Button = $VBox/HBox/Cancel
var old : String
var editing : bool

func _ready():
	old = description.text
	editing = false
	save.visible = false
	cancel.visible = false

func TextChanged():
	if !editing:
		editing = true
		save.visible = true
		cancel.visible = true
	else:
		pass

func SaveChanges():
	editing = false
	save.visible = false
	cancel.visible = false
	old = description.text

func CancelChanges():
	editing = false
	save.visible = false
	cancel.visible = false
	description.text = old
