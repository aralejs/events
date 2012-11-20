define(function(require) {

  // Thanks to:
  //  - https://github.com/documentcloud/backbone/blob/master/test/events.js
  var Events = require('../src/events')

  describe('Events', function() {

    it('on and trigger', function() {
      var obj = new Events()
      obj.counter = 0

      obj.on('event', function() {
        obj.counter += 1
      })

      obj.trigger('event')
      expect(obj.counter).to.equal(1)

      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')
      expect(obj.counter).to.equal(5)
    })

    it('binding and triggering multiple events', function() {
      var obj = new Events()
      obj.counter = 0

      obj.on('a b c', function() {
        obj.counter += 1
      })

      obj.trigger('a')
      expect(obj.counter).to.equal(1)

      obj.trigger('a b')
      expect(obj.counter).to.equal(3)

      obj.trigger('c')
      expect(obj.counter).to.equal(4)

      obj.off('a c')
      obj.trigger('a b c')
      expect(obj.counter).to.equal(5)
    })

    it('trigger all for each event', function() {
      var obj = new Events()
      obj.counter = 0
      var a, b

      obj.on('all',function(event) {
        obj.counter++
        if (event == 'a') a = true
        if (event == 'b') b = true
      }).trigger('a b')

      expect(a).to.equal(true)
      expect(b).to.equal(true)
      expect(obj.counter).to.equal(2)
    })

    it('on, then unbind all functions', function() {
      var obj = new Events()
      obj.counter = 0

      function callback() {
        obj.counter += 1
      }

      obj.on('event', callback)
      obj.trigger('event')
      obj.off('event')
      obj.trigger('event')
      expect(obj.counter).to.equal(1)
    })

    it('bind two callbacks, unbind only one', function() {
      var obj = new Events()
      obj.counterA = 0
      obj.counterB = 0

      function callback() {
        obj.counterA += 1
      }

      obj.on('event', callback)
      obj.on('event', function() {
        obj.counterB += 1
      })
      obj.trigger('event')
      obj.off('event', callback)
      obj.trigger('event')

      expect(obj.counterA).to.equal(1)
      expect(obj.counterB).to.equal(2)
    })

    it('unbind a callback in the midst of it firing', function() {
      var obj = new Events()
      obj.counter = 0

      function callback() {
        obj.counter += 1
        obj.off('event', callback)
      }

      obj.on('event', callback)
      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')

      expect(obj.counter).to.equal(1)
    })

    it('two binds that unbind themeselves', function() {
      var obj = new Events()
      obj.counterA = 0
      obj.counterB = 0

      function incrA() {
        obj.counterA += 1
        obj.off('event', incrA)
      }

      function incrB() {
        obj.counterB += 1
        obj.off('event', incrB)
      }

      obj.on('event', incrA)
      obj.on('event', incrB)
      obj.trigger('event')
      obj.trigger('event')
      obj.trigger('event')

      expect(obj.counterA).to.equal(1)
      expect(obj.counterB).to.equal(1)
    })

    it('bind a callback with a supplied context', function() {
      function TestClass() {
      }

      TestClass.prototype.assertTrue = function() {
        return true
      }

      var obj = new Events()

      obj.on('event', function() {
        expect(this.assertTrue()).to.equal(true)
      }, (new TestClass))

      obj.trigger('event')
    })

    it('nested trigger with unbind', function() {
      var obj = new Events()
      obj.counter = 0

      function incr1() {
        obj.counter += 1
        obj.off('event', incr1)
        obj.trigger('event')
      }

      function incr2() {
        obj.counter += 1
      }

      obj.on('event', incr1)
      obj.on('event', incr2)
      obj.trigger('event')

      expect(obj.counter).to.equal(3)
    })

    it('callback list is not altered during trigger', function() {
      var counter = 0
      var obj = new Events()

      function incr() {
        counter++
      }

      obj.on('event',function() {
        obj.on('event', incr).on('all', incr)
      }).trigger('event')

      // bind does not alter callback list
      expect(counter).to.equal(0)

      counter = 0
      obj.off()
          .on('event', function() {
            obj.off('event', incr).off('all', incr)
          })
          .on('event', incr)
          .on('all', incr)
          .trigger('event')

      // unbind does not alter callback list
      expect(counter).to.equal(2)

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
      var counter = 0
      var obj = new Events()

      function incr() {
        counter++
      }

      obj.on('x', function() {
        obj.on('y', incr)
      })
      obj.trigger('x y')

      expect(counter).to.equal(1)

      counter = 0
      obj.off()
      obj.on('x', function() {
        obj.on('y', incr)
      })
      obj.trigger('y x')

      expect(counter).to.equal(0)
    })

    it('`all` callback list is retrieved after each event', function() {
      var counter = 0
      var obj = new Events()

      function incr() {
        counter++
      }

      obj.on('x',function() {
        obj.on('y', incr).on('all', incr)
      }).trigger('x y')

      expect(counter).to.equal(2)
    })

    it('if no callback is provided, `on` is a noop', function() {
      new Events().on('test').trigger('test')
    })

    it('remove all events for a specific context', function() {
      var obj = new Events()
      var a = 0
      var b = 0

      obj.on('x y all', function() {
        a++
      })

      obj.on('x y all', function() {
        b++
      }, obj)

      obj.off(null, null, obj)
      obj.trigger('x y')

      expect(a).to.equal(4)
      expect(b).to.equal(0)
    })

    it('remove all events for a specific callback', function() {
      var obj = new Events()
      var a = 0
      var b = 0

      function success() {
        a++
      }

      function fail() {
        b++
      }

      obj.on('x y all', success)
      obj.on('x y all', fail)
      obj.off(null, fail)
      obj.trigger('x y')

      expect(a).to.equal(4)
      expect(b).to.equal(0)
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
      var obj = { counter: 0 }
      Events.mixTo(obj)

      function incr() {
        obj.counter++
      }

      obj.on('x y', incr).off('x').trigger('x y')
      expect(obj.counter).to.equal(1)
    })

    it('mixTo Class function', function() {
      function F() {
        this.counter = 0
      }

      Events.mixTo(F)
      var obj = new F()

      function incr() {
        obj.counter++
      }

      obj.on('x y', incr).off('x').trigger('x y')
      expect(obj.counter).to.equal(1)
    })

    it('splice bug for `off`', function() {
      var counter = 0

      function f1() {
        counter++
      }

      function f2() {
        counter++
      }

      var obj = new Events()
      obj.on('event', f1)
      obj.on('event', f1)
      obj.on('event', f2)

      obj.trigger('event')
      expect(counter).to.equal(3)

      obj.off(null, f1)
      obj.off(null, f2)

      obj.trigger('event')
      expect(counter).to.equal(3)
    })
  })
})
