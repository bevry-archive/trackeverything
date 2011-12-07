(function() {
  var App, Collection, Collections, Model, Models, View, Views, entries, tracker;

  View = Backbone.View;

  Model = Backbone.Model;

  Collection = Backbone.Collection;

  Views = {};

  Models = {};

  Collections = {};

  View.prototype.renderTo = function($container) {
    this.render();
    this.el.appendTo($container);
    return this;
  };

  Models.Group = Model.extend({
    _defaults: {
      slug: null,
      name: null,
      admins: null,
      users: null
    }
  });

  Models.User = Model.extend({
    _defaults: {
      username: null,
      name: null,
      email: null,
      password: null
    }
  });

  Models.Entry = Model.extend({
    _defaults: {
      start: null,
      finish: null,
      duration: null,
      message: null,
      user: null,
      location: null,
      privacy: null,
      mentions: null
    },
    finish: function(message) {
      this.set({
        message: message,
        finish: new Date()
      });
      this.set({
        duration: this.duration()
      });
      return this;
    },
    duration: function() {
      var finish, result, start;
      start = new XDate(this.get('start'));
      finish = new XDate(this.get('finish') || new Date());
      if (start === finish) {
        result = false;
      } else {
        result = {
          hours: Math.floor(start.diffHours(finish)),
          minutes: Math.floor(start.diffMinutes(finish)),
          seconds: Math.floor(start.diffSeconds(finish))
        };
        result.seconds -= result.minutes * 60;
        result.minutes -= result.hours * 60;
      }
      return result;
    }
  });

  Collections.Entries = Collection.extend({
    model: Models.Entry
  });

  Models.App = Model.extend({
    _defaults: {
      user: null,
      entries: null
    },
    entries: function() {
      var entries;
      entries = this.get('entries');
      if (!entries) {
        entries = new Collections.Entries();
        this.set({
          entries: entries
        });
      }
      return entries;
    }
  });

  Views.DateTime = View.extend({
    render: function() {
      var attr, datetime, text;
      datetime = this.model;
      attr = datetime.toUTCString();
      text = datetime.toLocaleTimeString();
      this.el = $(this.el || '<time>').attr('datetime', attr).text(text);
      return this;
    }
  });

  Views.Duration = View.extend({
    render: function() {
      var duration, parts, text;
      duration = this.model;
      parts = [];
      if (duration.hours) parts.push("" + duration.hours + "h");
      if (duration.minutes) parts.push("" + duration.minutes + "m");
      if (duration.seconds) parts.push("" + duration.seconds + "s");
      text = parts.join(' ');
      this.el = $(this.el || '<time>').text(text);
      return this;
    }
  });

  Views.Entry = View.extend({
    render: function() {
      var duration, finish, message, start;
      this.el = $("#templates .entry").clone().replaceAll(this.el);
      this.$start = this.$('.start');
      this.$finish = this.$('.finish');
      this.$duration = this.$('.duration');
      this.$message = this.$('.message');
      start = this.model.get('start');
      finish = this.model.get('finish');
      duration = this.model.duration();
      message = this.model.get('message');
      new Views.DateTime({
        el: this.$start,
        model: start
      }).render();
      new Views.DateTime({
        el: this.$finish,
        model: finish
      }).render();
      new Views.Duration({
        el: this.$duration,
        model: duration
      }).render();
      if (message) {
        this.$message.text(message);
      } else {
        this.$message.html('no message &hellip;');
      }
      return this;
    }
  });

  Views.Entries = View.extend({
    render: function() {
      var _this = this;
      this.el = $("#templates .entries").clone().replaceAll(this.el);
      this.$list = this.$('.list');
      this.collection.toArray().reverse().forEach(function(entry) {
        return new Views.Entry({
          model: entry
        }).renderTo(_this.$list);
      });
      return this;
    }
  });

  Views.Tracker = View.extend({
    entry: null,
    timer: null,
    $start: null,
    $logged: null,
    $since: null,
    $sinceTimer: null,
    $finish: null,
    $message: null,
    render: function() {
      var _this = this;
      this.el = $("#templates .tracker").clone().replaceAll(this.el);
      this.$start = this.$('.start');
      this.$logged = this.$('.logged');
      this.$loggedTime = this.$logged.find('time');
      this.$since = this.$('.since');
      this.$sinceTime = this.$since.find('time');
      this.$finish = this.$('.finish').hide();
      this.$message = this.$('.message');
      this.timerAction = function() {
        var duration, start;
        start = new XDate(_this.entry.get('start'));
        duration = _this.entry.duration();
        new Views.DateTime({
          el: _this.$sinceTime,
          model: start
        }).render();
        return new Views.Duration({
          el: _this.$loggedTime,
          model: duration
        }).render();
      };
      this.$start.click(function() {
        return _this.start();
      });
      this.$finish.click(function() {
        return _this.finish();
      });
      this.$message.blur(function() {
        return _this.log();
      });
      return this;
    },
    start: function() {
      this.entry = new Models.Entry({
        start: new Date(),
        user: App.get('user')
      });
      this.$start.hide();
      this.$finish.show();
      this.timer = setInterval(this.timerAction, 1000);
      return this;
    },
    finish: function() {
      var message;
      if (!this.entry) this.start();
      clearInterval(this.timer);
      message = this.$message.val();
      App.entries().add(this.entry.finish(message));
      this.entry = null;
      this.$finish.hide();
      this.$start.show();
      this.$message.val('');
      return this;
    },
    log: function() {
      var resume;
      resume = this.entry != null;
      this.finish();
      if (resume) this.start();
      return this;
    }
  });

  App = window.App = new Models.App();

  tracker = new Views.Tracker().renderTo($("<div id='#tracker'>").appendTo("#wrapper"));

  entries = new Views.Entries({
    collection: App.entries()
  }).renderTo($("<div id='#entries'>").appendTo("#wrapper"));

  App.entries().bind('all', function() {
    return entries.render();
  });

}).call(this);
