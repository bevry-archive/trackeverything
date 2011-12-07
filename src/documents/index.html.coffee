---
title: 'Easy Time'
layout: 'default'
---

div "#templates", ->

	div ".tracker", ->
		button ".start", -> "Start Tracking"
		button ".finish", -> "Stop Tracking"
		div ".progress", ->
			span ".logged", -> "logging <time>4h 53m</time>"
			span ".since", -> "since <time>12:53pm</time>"
		input ".message", placeholder: "Log a message &hellip;"

	div ".entries", ->
		ul ".list", ->
	
	li ".entry", ->
		div ".user", ->
			span ".username", -> "balupton"
			span ".name", -> "Benjamin Lupton"
			img ".avatar", src: '/images/balupton.jpg'
		time ".start", datetime:"2008-02-14", -> "5:53pm"
		time ".finish", datetime:"2008-02-14", -> "6:53pm"
		time '.duration', -> "1h 00m"
		div ".message", -> "ate #dinner"

div "#wrapper", ->