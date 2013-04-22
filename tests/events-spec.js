define(function(require) {

  // Thanks to:
  //  - https://github.com/documentcloud/backbone/blob/master/test/events.js
  var Events = require('events')
  var expect = require('expect')
  var sinon = require('sinon')

  describe('Events', function() {

    it('on and trigger', function() {
      var obj = new Events()
      var spy = sinon.spy()

      obj.on('event', spy)

      obj.trigger('event')
      expect(spy.callCount).to.be(1)

      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')
      expect(spy.callCount).to.be(5)
    })

    it('binding and triggering multiple events', function() {
      var obj = new Events()
      var spy = sinon.spy()

      obj.on('a b c', spy)

      obj.trigger('a')
      expect(spy.callCount).to.be(1)

      obj.trigger('a b')
      expect(spy.callCount).to.be(3)

      obj.trigger('c')
      expect(spy.callCount).to.be(4)

      obj.off('a c')
      obj.trigger('a b c')
      expect(spy.callCount).to.be(5)
    })

    it('trigger all for each event', function() {
      var obj = new Events()
      var spy = sinon.spy()
      var spy2 = sinon.spy()

      obj.on('all', spy)
      obj.on('c', spy2)

      obj.trigger('a b')
      expect(spy.callCount).to.be(2)
      expect(spy.calledWith('a'))
      expect(spy.calledWith('b'))
      spy.reset()

      obj.trigger('c')
      expect(spy.callCount).to.be(1)
      expect(spy2.callCount).to.be(1)
      expect(spy2.calledBefore(spy))
    })

    it('on, then unbind all functions', function() {
      var obj = new Events()
      var spy = sinon.spy()

      obj.on('event', spy)
      obj.trigger('event')
      expect(spy.callCount).to.be(1)

      obj.off('event')
      obj.trigger('event')
      expect(spy.callCount).to.be(1)
    })

    it('bind two callbacks, unbind only one', function() {
      var obj = new Events()
      var spyA = sinon.spy()
      var spyB = sinon.spy()

      obj.on('event', spyA)
      obj.on('event', spyB)

      obj.trigger('event')
      expect(spyA.callCount).to.be(1)
      expect(spyB.callCount).to.be(1)

      obj.off('event', spyA)
      obj.trigger('event')
      expect(spyA.callCount).to.be(1)
      expect(spyB.callCount).to.be(2)
    })

    it('unbind a callback in the midst of it firing', function() {
      var obj = new Events()
      var spy = sinon.spy()

      function callback() {
        spy()
        obj.off('event', callback)
      }

      obj.on('event', callback)
      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')

      expect(spy.callCount).to.be(1)
    })

    it('two binds that unbind themeselves', function() {
      var obj = new Events()
      var spyA = sinon.spy()
      var spyB = sinon.spy()

      function incrA() {
        spyA()
        obj.off('event', incrA)
      }

      function incrB() {
        spyB()
        obj.off('event', incrB)
      }

      obj.on('event', incrA)
      obj.on('event', incrB)
      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')

      expect(spyA.callCount).to.be(1)
      expect(spyB.callCount).to.be(1)
    })

    it('bind a callback with a supplied context', function() {
      var obj = new Events()
      var context = {}
      var spy = sinon.spy()

      obj.on('event', spy, context)

      obj.trigger('event')
      expect(spy.calledOn(context))
    })

    it('nested trigger with unbind', function() {
      var obj = new Events()
      var spy1 = sinon.spy()
      var spy2 = sinon.spy()

      function incr1() {
        spy1()
        obj.off('event', incr1)
        obj.trigger('event')
      }

      obj.on('event', incr1)
      obj.on('event', spy2)
      obj.trigger('event')

      expect(spy1.callCount).to.be(1)
      expect(spy2.callCount).to.be(2)
    })

    it('callback list is not altered during trigger', function() {
      var obj = new Events()
      var spy = sinon.spy()

      obj.on('event',function() {
        obj.on('event', spy).on('all', spy)
      }).trigger('event')

      // bind does not alter callback list
      expect(spy.callCount).to.equal(0)

      obj.off()
          .on('event', function() {
            obj.off('event', spy).off('all', spy)
          })
          .on('event', spy)
          .on('all', spy)
          .trigger('event')

      // unbind does not alter callback list
      expect(spy.callCount).to.equal(2)

      // 注：
      // 1. jQuery 里，是冻结的，在 triggering 时，新增或删除都不影响
      //    当前 callbacks list
      // 2. Backbone 同 jQuery
      // 3. Chrome 下，原生 addEventListener:
      //    - 新增的，需要下一次才触发
      //    - 其他修改，立刻生效（与 forEach 类似）
      //    - 如果 addEventListener 同一个 fn, 会去重，只触发一次
      // 4. NodeJS 也是冻结的（slice 了一下）
      //
      // 从 emit 性质考虑，各个 callback 间不应该互相影响，因此 jQuery 的方式
      // 是值得推崇的：任何修改，都等下一次才生效。
      //
      // Ref:
      //  - https://github.com/documentcloud/backbone/pull/723

    })

    it('`o.trigger("x y")` is equal to `o.trigger("x").trigger("x")`', function() {
      var obj = new Events()
      var spy = sinon.spy()

      obj.on('x', function() {
        obj.on('y', spy)
      })
      obj.trigger('x y')

      expect(spy.callCount).to.be(1)
      spy.reset()

      obj.off()
      obj.on('x', function() {
        obj.on('y', spy)
      })
      obj.trigger('y x')

      expect(spy.callCount).to.be(0)
    })

    it('`all` callback list is retrieved after each event', function() {
      var obj = new Events()
      var spy = sinon.spy()

      obj.on('x',function() {
        obj.on('y', spy).on('all', spy)
      }).trigger('x y')

      expect(spy.callCount).to.be(2)
    })

    it('if no callback is provided, `on` is a noop', function() {
      expect(function() {
        new Events().on('test').trigger('test')
      }).not.to.throwException();
    })

    it('remove all events for a specific context', function() {
      var obj = new Events()
      var spyA = sinon.spy()
      var spyB = sinon.spy()
      var a = 0
      var b = 0

      obj.on('x y all', spyA)

      obj.on('x y all', spyB, obj)

      obj.off(null, null, obj)
      obj.trigger('x y')

      expect(spyA.callCount).to.be(4)
      expect(spyB.callCount).to.be(0)
    })

    it('remove all events for a specific callback', function() {
      var obj = new Events()
      var success = sinon.spy()
      var fail = sinon.spy()

      obj.on('x y all', success)
      obj.on('x y all', fail)
      obj.off(null, fail)
      obj.trigger('x y')

      expect(success.callCount).to.equal(4)
      expect(fail.callCount).to.equal(0)
    })

    it('off is chainable', function() {
      var obj = new Events()

      // With no events
      expect(obj.off()).to.equal(obj)

      // When removing all events
      obj.on('event', function() {
      }, obj)
      expect(obj.off()).to.equal(obj)

      // When removing some events
      obj.on('event', function() {
      }, obj)
      expect(obj.off('event')).to.equal(obj)
    })

    // 百年难得一遇，不考虑
    it.skip('no DontEnums bug', function() {
      var obj = new Events()
      var counter = 0

      obj.on('toString', function() {
        counter++
      })

      obj.on('valueOf', function() {
        counter++
      })

      obj.trigger('toString')
      obj.trigger('valueOf')

      expect(counter).to.equal(2)
    })

    // 非常稀有的场景，不值得
    it.skip('hasOwnProperty is ok', function() {
      var obj = new Events()
      var counter = 0

      obj.on('hasOwnProperty', function() {
        counter++
      })

      obj.trigger('hasOwnProperty')

      expect(counter).to.equal(1)
    })

    it('mixTo object instance', function() {
      var obj = {}
      Events.mixTo(obj)
      var spy = sinon.spy()

      obj.on('x y', spy).off('x').trigger('x y')
      expect(spy.callCount).to.equal(1)
    })

    it('mixTo Class function', function() {
      function F() {
        this.counter = 0
      }

      Events.mixTo(F)
      var obj = new F()

      var spy = sinon.spy()

      obj.on('x y', spy).off('x').trigger('x y')
      expect(spy.callCount).to.equal(1)
    })

    it('splice bug for `off`', function() {
      var spy1 = sinon.spy()
      var spy2 = sinon.spy()

      var obj = new Events()
      obj.on('event', spy1)
      obj.on('event', spy1)
      obj.on('event', spy2)

      obj.trigger('event')
      expect(spy1.callCount).to.be(2)
      expect(spy2.callCount).to.be(1)

      obj.off(null, spy1)
      obj.off(null, spy2)

      obj.trigger('event')
      expect(spy1.callCount).to.be(2)
      expect(spy2.callCount).to.be(1)
    })

    it('trigger returns callback status', function() {
      var obj = new Events()
      var stub1 = sinon.stub()
      var stub2 = sinon.stub()
      var stub3 = sinon.stub()

      obj.on('a', stub1)
      obj.on('a', stub2)
      obj.on('all', stub3)

      stub1.returns(false)
      stub2.returns(true)
      stub3.returns('')
      expect(obj.trigger('a')).to.be(false)

      stub1.returns(undefined)
      stub2.returns(null)
      stub3.returns('')
      expect(obj.trigger('a')).not.to.be(false)

      stub1.returns(true)
      stub2.returns(true)
      stub3.returns(false)
      expect(obj.trigger('a')).to.be(false)
    })

    it('ignore exception in callback list', function() {
      var obj = new Events()
      var err = new Error()
      var spy1 = sinon.spy()
      var spy2 = sinon.spy()
      var stub = sinon.stub()

      if (window.console && console.error &&
            Object.prototype.toString.call(console.error) === '[object Function]') {
        var spy3 = sinon.spy(console, 'error')
      }

      obj.on('a', stub)
      obj.on('a', spy1)
      obj.on('all', spy2)

      stub.returns(false).throws(err)
      expect(function() {
        obj.trigger('a')
      }).not.to.throwException()
      expect(stub.called).to.be.ok()
      expect(spy1.called).to.be.ok()
      expect(spy2.called).to.be.ok()
      spy3 && expect(spy3.calledWith(err.stack)).to.be.ok()
    })

    it('callback context', function() {
      var obj = new Events()
      var spy = sinon.spy()
      obj.on('a', spy)

      obj.trigger('a')
      expect(spy.calledOn(obj)).to.be.ok()
    })
  })
})
