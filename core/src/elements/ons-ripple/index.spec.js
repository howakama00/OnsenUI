'use strict';

describe('OnsRippleElement', () => {
  let container, ripple, wave, background;

  const spyOn = chai.spy.on.bind(chai.spy, ons.elements.Ripple.prototype);

  beforeEach(done => {
    container = ons._util.createElement(`
      <button>
        <ons-ripple></ons-ripple>
        Click me!
      </button>
    `);
    document.body.appendChild(container);

    ripple = container.querySelector('ons-ripple');
    ripple.removeAttribute('disabled');

    ons._contentReady(ripple, () => {
      wave = ripple._wave;
      background = ripple._background;
      done();
    });
  });

  afterEach(() => {
    container.remove();
    container = ripple = null;
  });

  it('exists', () => {
    expect(window.ons.elements.Ripple).to.be.ok;
  });

  describe('class attribute', () => {
    it('should contain "ripple" class name automatically', () => {
      const element = new ons.elements.Ripple();
      element.setAttribute('class', 'foobar');
      expect(element.classList.contains('ripple')).to.be.ok;
      expect(element.classList.contains('foobar')).to.be.ok;
    });
  });

  it('provides modifier attribute', () => {
    var element = new ons.elements.Ripple();
    element.setAttribute('modifier', 'hoge');
    expect(element.classList.contains('ripple--hoge')).to.be.true;

    element.setAttribute('modifier', ' foo bar');
    expect(element.classList.contains('ripple--foo')).to.be.true;
    expect(element.classList.contains('ripple--bar')).to.be.true;
    expect(element.classList.contains('ripple--hoge')).not.to.be.true;

    element.classList.add('ripple--piyo');
    element.setAttribute('modifier', 'fuga');
    expect(element.classList.contains('ripple--piyo')).to.be.true;
    expect(element.classList.contains('ripple--fuga')).to.be.true;
  });

  describe('#_compile()', () => {
    it('is called when an element is created', done => {
      const spy = spyOn('_compile'),
        _ = new ons.elements.Ripple();

      ons._contentReady(_, () => {
        expect(spy).to.have.been.called.once;
        done();
      });
    });

    it('creates a "wave" element', done => {
      const ripple = new ons.elements.Ripple();
      ons._contentReady(ripple, () => {
        expect(ripple._wave).to.be.an.instanceof(HTMLElement);
        done();
      });
    });

    it('creates a "background" element', done => {
      const ripple = new ons.elements.Ripple();
      ons._contentReady(ripple, () => {
        expect(ripple._background).to.be.an.instanceof(HTMLElement);
        done();
      });
    });
  });

  describe('#attributeChangedCallback()', () => {
    const attributes = ['color', 'center', 'start-radius', 'background', 'modifier'];

    it('is called when an element is created', () => {
      const spy = spyOn('attributeChangedCallback'),
        _ = new ons.elements.Ripple();

      expect(spy).to.have.been.called.exactly(attributes.length);
    });

    it('sets the color of the wave based on the "color" attribute', () => {
      ripple.setAttribute('color', 'black');
      expect(wave.style.background).to.equal('black');
    });

    it('sets the color of the background based on the "color" attribute', () => {
      ripple.setAttribute('color', 'black');
      expect(background.style.background).to.equal('black');
    });

    it('sets the color of the background based on the "background" attribute', () => {
      ripple.setAttribute('color', 'black');
      ripple.setAttribute('background', 'rgb(0, 255, 255)');
      expect(background.style.background).to.equal('rgb(0, 255, 255)');
      ripple.setAttribute('color', 'lime');
      expect(background.style.background).to.equal('rgb(0, 255, 255)');
    });

    it('disables background if the "background" attribute is "none"', () => {
      ripple.setAttribute('background', 'none');
      expect(background.hasAttribute('disabled')).to.be.true;
    });

    it('makes sure the background is enabled if "background != none"', () => {
      background.setAttribute('disabled', 'disabled');
      ripple.setAttribute('background', 'rgb(0, 123, 5)');
      expect(background.hasAttribute('disabled')).to.be.false;
    });
  });


  describe('#_calculateCoords()', () => {
    const e = {
      changedTouches: [{
        clientX: 350,
        clientY: 250
      }]
    };

    const style = {
      width: '650px',
      height: '450px',
      position: 'fixed',
      top: '100px',
      left: '100px'
    };

    it('can do math', () => {
      ons._util.extend(ripple.style, style);

      const coords = ripple._calculateCoords(e);

      expect(coords.x).to.equal(250);
      expect(coords.y).to.equal(150);
      expect(coords.r).to.equal(500);
    });

    it('cares about it\'s center', () => {
      ons._util.extend(ripple.style, style);
      ripple.setAttribute('center', 'true');
      const coords = ripple._calculateCoords({clientY: 0, clientX: 0});

      expect(coords.x).to.equal(325);
      expect(coords.y).to.equal(225);
      expect(coords.r).to.be.closeTo(Math.sqrt(169 + 81) * 25, 0.001);
    });
  });

  const itCalls = calling => {
    return {
      whenUsing: (whenUsing, ...rest) => {
        it(`calls ${calling}`, done => {
          const spy = spyOn(calling),
            ripple = new ons.elements.Ripple();

          ons._contentReady(ripple, () => {
            ripple[whenUsing].apply(ripple, rest);
            expect(spy).to.have.been.called.once;
            done();
          });
        });
      }
    };
  };

  const e = {
    gesture: {
      direction: 'left',
      srcEvent: {
        changedTouches: [{
          clientX: 20,
          clientY: 10
        }]
      }
    }
  };

  describe('#_rippleAnimation()', () => {
    it('changes the location of the wave', () => {
      const {left, top} = wave.style;

      ripple._rippleAnimation(e.gesture.srcEvent);

      expect(wave.style.left).not.to.equal(left);
      expect(wave.style.top).not.to.equal(top);
    });

  });

  describe('#_onTap()', () => {
    itCalls('_rippleAnimation').whenUsing('_onTap', e);
  });

  describe('#_onHold()', () => {
    it('sets _holding', () => {
      expect(ripple._holding).to.not.be.ok;
      ripple._onHold(e);
      expect(ripple._holding).to.be.ok;
    });
  });

  describe('#_onDragStart()', () => {
    itCalls('_rippleAnimation').whenUsing('_onDragStart', e);

    it('calls _onRelease', () => {
      const spy = spyOn('_onRelease');

      ripple._onHold(e);
      ripple._onDragStart(e);
      expect(spy).to.have.been.called.once;
    });
  });

  describe('#_onRelease()', () => {
    it('unsets _holding', () => {
      ripple._onHold(e);
      expect(ripple._holding).to.be.ok;
      ripple._onRelease(e);
      expect(ripple._holding).to.not.be.ok;
    });
  });
});
