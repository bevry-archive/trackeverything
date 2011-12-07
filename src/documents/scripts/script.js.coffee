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

# Group
Models.Group = Model.extend({
	_defaults:
		slug: null
		name: null
		admins: null # users
		users: null
		#domains: null
		#entries: null
})

# User
Models.User = Model.extend({
	_defaults:
		username: null
		name: null
		email: null
		password: null
		#groups: null
		#entries: null
})

# Entry
Models.Entry = Model.extend({
	_defaults:
		start: null
		finish: null
		duration: null
		message: null
		user: null
		location: null # geolocation
		privacy: null # user, group
		mentions: null # users, groups
	
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
			result = false
		else
			result = {
				hours: Math.floor start.diffHours(finish)
				minutes: Math.floor start.diffMinutes(finish)
				seconds: Math.floor start.diffSeconds(finish)
			}
			result.seconds -= result.minutes*60
			result.minutes -= result.hours*60
		result
})



# =====================================
# Collections

# Entries
Collections.Entries = Collection.extend({
	model: Models.Entry
})

# App
Models.App = Model.extend({
	_defaults:
		user: null
		entries: null
	entries: ->
		entries = @get('entries')
		unless entries
			entries = new Collections.Entries()
			@set entries: entries
		entries
})


# =====================================
# Views

# DateTime
Views.DateTime = View.extend({
	render: ->
		datetime = this.model
		attr = datetime.toUTCString()
		text = datetime.toLocaleTimeString()
		@el = $(@el or '<time>').attr('datetime',attr).text(text)
		@
})

# Duration
Views.Duration = View.extend({
	render: ->
		duration = this.model
		parts = []
		parts.push "#{duration.hours}h"  if duration.hours
		parts.push "#{duration.minutes}m"  if duration.minutes
		parts.push "#{duration.seconds}s"  if duration.seconds
		text = parts.join(' ')
		@el = $(@el or '<time>').text(text)
		@
})

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
		new Views.DateTime(el: @$start, model: start).render()
		new Views.DateTime(el: @$finish, model: finish).render()
		new Views.Duration(el: @$duration, model: duration).render()
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
			new Views.DateTime(el: @$sinceTime, model: start).render()
			new Views.Duration(el: @$loggedTime, model: duration).render()

		# Actions
		@$start.click => @start()
		@$finish.click => @finish()
		@$message.blur => @log()
		@

	start: ->
		@entry = new Models.Entry({
			start: new Date()
			user: App.get('user')
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