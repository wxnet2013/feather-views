
/**
 * Module dependencies.
 */

var debug = require('debug')('koa-views');
var resolve = require('path').resolve;
var dirname = require('path').dirname;
var assign = require('object-assign');
var fmt = require('util').format;
var join = require('path').join;
var cons = require('co-views');
var send = require('koa-send');

/**
 * Add `render` method.
 *
 * @param {String} path (optional)
 * @param {Object} opts (optional)
 * @api public
 */

module.exports = function (path, opts) {
  var base = dirname(module.parent.filename);

  // set path relative to the directory the function was called + path
  if (!path || typeof path == 'object') {
    opts = path;
    path = base;
  } else {
    path = resolve(base, path);
  }

  opts = opts || {};

  // default extension to `html`
  if (!opts.default) opts.default = 'html';

  debug(fmt('options: %s', opts));

  return function *views (next) {
    if (this.render) return yield next;
    var render = cons(path, opts);
    this.state = this.state || {}

    /**
     * Render `view` with `locals` and `koa.ctx.state`.
     *
     * @param {String} view
     * @param {Object} locals
     * @return {GeneratorFunction}
     * @api public
     */

    this.render = function *(view, locals) {
      var ext = opts.default;
	  locals.partials = locals.partials || {};
	  locals.partials['yield'] = view;
	  view = 'layout';

      if(view[view.length - 1] === '/'){
        view += 'index';
      }
      var file = fmt('%s.%s', view, ext);

      locals = locals || {};
      var state = assign(locals, this.state);

      debug(fmt('render `%s` with %j', file, state));

      if (ext == 'html' && !opts.map) {
        yield send(this, join(path, file));
      } else {
        this.body = yield render(view, state);
      }

      this.type = 'text/html';
    }

    yield next;
  }
}
