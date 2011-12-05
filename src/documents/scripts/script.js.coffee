# =====================================
# Prepare

# Shortcuts
View = Backbone.View
Model = Backbone.Model
Collection = Backbone.Collection

# Setup
Views = {}
Models = {}
Collections = {}

# Extensions
View::renderTo = ($container) ->
	@render()
	@el.appendTo($container)
	@


# =====================================
# Models

# Domain
Models.Domain = Model.extend({
	_defaults:
		slug: null
		name: null
		#users: null
		#entries: null
})

# Author
Models.Author = Model.extend({
	_defaults:
		username: null
		name: null
		email: null
		password: null
		#domains: null
		#entries: null
})

# Entry
Models.Entry = Model.extend({
	_defaults:
		start: null
		finish: null
		duration: null
		message: null
		author: null
	finish: (message) ->
		@set
			message: message
			finish: new Date()
		@set duration: @duration()
		@

	duration: ->
		start = new XDate @get('start')
		finish = new XDate @get('finish') or new Date()
		if start is finish
			false
		else
			{
				hours: Math.floor start.diffHours(finish)
				minutes: Math.floor start.diffMinutes(finish)
				seconds: Math.floor start.diffSeconds(finish)
			}
})

# App
Models.App = Model.extend({
	_defaults:
		author: null
		domain: null
		entries: null
	entries: ->
		entries = @get('entries')
		unless entries
			entries = new Collections.Entries()
			@set entries: entries
		entries
})


# =====================================
# Collections

# Domains
Collections.Domains = Collection.extend({
	model: Models.Domain
})

# Authors
Collections.Authors = Collection.extend({
	model: Models.Author
})

# Entries
Collections.Entries = Collection.extend({
	model: Models.Entry
})



# =====================================
# Views

# Entry
Views.Entry = View.extend({
	render: ->
		# Prepare
		@el = $("#templates .entry").clone().replaceAll(@el)
		@$start = @$('.start')
		@$finish = @$('.finish')
		@$duration = @$('.duration')
		@$message = @$('.message')

		# Values
		start = @model.get('start')
		finish = @model.get('finish')
		duration = @model.duration()
		message = @model.get('message')
		@$start.attr('datetime',start.toUTCString()).text(start.toLocaleTimeString())
		@$finish.attr('datetime',finish.toUTCString()).text(finish.toLocaleTimeString())
		@$duration.text("#{duration.hours}h #{duration.minutes}m #{duration.seconds}s")
		if message
			@$message.text(message)
		else
			@$message.html('no message &hellip;')
		
		# Chain
		@
})

# Entries
Views.Entries = View.extend({
	render: ->
		# Prepare
		@el = $("#templates .entries").clone().replaceAll(@el)
		@$list = @$('.list')

		# Render each entry
		@collection.toArray().reverse().forEach (entry) =>
			new Views.Entry({
				model: entry
			}).renderTo @$list
		
		# Chain
		@
})

# Tracker
Views.Tracker = View.extend({
	entry: null
	timer: null
	$start: null
	$logged: null
	$since: null
	$sinceTimer: null
	$finish: null
	$message: null

	render: ->
		# Prepare
		@el = $("#templates .tracker").clone().replaceAll(@el)
		@$start = @$('.start')
		@$logged = @$('.logged')
		@$loggedTime = @$logged.find('time')
		@$since = @$('.since')
		@$sinceTime = @$since.find('time')
		@$finish = @$('.finish').hide()
		@$message = @$('.message')
		@timerAction = =>
			start = new XDate @entry.get('start')
			duration = @entry.duration()
			@$loggedTime.text "#{duration.hours}h #{duration.minutes}m #{duration.seconds}s"
			@$sinceTime.text start.toLocaleTimeString()

		# Actions
		@$start.click => @start()
		@$finish.click => @finish()
		@$message.blur => @log()
		@

	start: ->
		@entry = new Models.Entry({
			start: new Date()
			author: App.get('author')
		})
		@$start.hide()
		@$finish.show()
		@timer = setInterval @timerAction, 1000
		@

	finish: ->
		@start()  unless @entry
		clearInterval(@timer)
		message = @$message.val()
		App.entries().add @entry.finish(message)
		@entry = null
		@$finish.hide()
		@$start.show()
		@$message.val('')
		@
	
	log: ->
		resume = @entry?
		@finish()
		@start()  if resume
		@

})


# =====================================
# App

App = window.App = new Models.App()

tracker = new Views.Tracker().renderTo $("<div id='#tracker'>").appendTo("#wrapper")

entries = new Views.Entries({
	collection: App.entries()
}).renderTo $("<div id='#entries'>").appendTo("#wrapper")

App.entries().bind 'all', -> entries.render()