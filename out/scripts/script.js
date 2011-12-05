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

  Models.Domain = Model.extend({
    _defaults: {
      slug: null,
      name: null
    }
  });

  Models.Author = Model.extend({
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
      author: null
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
      var finish, start;
      start = new XDate(this.get('start'));
      finish = new XDate(this.get('finish') || new Date());
      if (start === finish) {
        return false;
      } else {
        return {
          hours: Math.floor(start.diffHours(finish)),
          minutes: Math.floor(start.diffMinutes(finish)),
          seconds: Math.floor(start.diffSeconds(finish))
        };
      }
    }
  });

  Models.App = Model.extend({
    _defaults: {
      author: null,
      domain: null,
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

  Collections.Domains = Collection.extend({
    model: Models.Domain
  });

  Collections.Authors = Collection.extend({
    model: Models.Author
  });

  Collections.Entries = Collection.extend({
    model: Models.Entry
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
      this.$start.attr('datetime', start.toUTCString()).text(start.toLocaleTimeString());
      this.$finish.attr('datetime', finish.toUTCString()).text(finish.toLocaleTimeString());
      this.$duration.text("" + duration.hours + "h " + duration.minutes + "m " + duration.seconds + "s");
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
        _this.$loggedTime.text("" + duration.hours + "h " + duration.minutes + "m " + duration.seconds + "s");
        return _this.$sinceTime.text(start.toLocaleTimeString());
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
        author: App.get('author')
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
