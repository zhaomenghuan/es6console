import Compilers from './compilers';

// Disable modules so we do not insert use-strict
// on the first line.
const ES2015 = ['es2015', { modules: false }];

var runtimeScripts = [
  '/node_modules/babel-polyfill/dist/polyfill.js',
  // '/node_modules/babel-core/browser-polyfill.js',
  // '/node_modules/traceur/bin/traceur-runtime.js',
  // '/node_modules/regenerator/runtime.js'
];

export default class SandBox {
  constructor( cnsl ) {
    this.cnsl = cnsl;

    var body = document.getElementsByTagName('body')[0];
    this.frame = document.createElement('iframe');
    body.appendChild(this.frame);
  
    this.cnsl.wrapLog(this.frame.contentWindow.console);

    for( let src of runtimeScripts ) {
      var script = this.frame.contentDocument.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      this.frame.contentDocument.body.appendChild(script);
    }
  }

  updateUserCode( code, onlyUpdate ) {
    if( onlyUpdate && this.userCode && this.userCode.innerHTML == code ) return;

    if(this.userCode) this.frame.contentDocument.body.removeChild(this.userCode);

    this.userCode = this.frame.contentDocument.createElement('script');
    this.userCode.type = 'text/javascript';
    this.frame.contentDocument.body.appendChild(this.userCode);

    this.userCode.innerHTML = code;
  }

  runCode( code ) {
    let out = {};

    try {
      code = Compilers['Babel'].compile(code, { presets: [ES2015] }).code;
      out.completionValue = this.frame.contentWindow.eval.call(null,code);
    } catch(e) {
      out.error = true;
      if(e instanceof this.frame.contentWindow.Error) {
        out.completionValue = window[e.name](e.message); // e is an instance of an Error object from the frames window object
      } else {
        out.completionValue = new Error(e);
      }
      out.recoverable = (( e instanceof SyntaxError || e instanceof this.frame.contentWindow.SyntaxError ) && e.message.match('Unexpected (token|end)'));
    }
    return out;
  }
}
