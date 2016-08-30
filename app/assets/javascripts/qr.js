var $canvas, $video, captureToCanvas, ctx, h, initDom, initWebcam, isCanvasSupported, load, localMediaInterval, localMediaStream, qrReactiveDict, showingCanvas, started, stopCapture, support, w;

qrReactiveDict = new ReactiveDict;

this.qrScanner = {
  message: function() {
    return qrReactiveDict.get('message');
  },
  on: function(eventName, callback) {
    return this[eventName] = callback;
  },
  off: function(eventName) {
    return delete this[eventName];
  },
  imageData: function() {
    return ctx.getImageData(0, 0, w, h);
  },
  imageDataURL: function() {
    return $canvas[0].toDataURL("image/jpeg");
  },
  isStarted: function() {
    return started;
  },
  isSupported: function() {
    return support;
  },
  stopCapture: function() {
    return stopCapture();
  }
};

$canvas = null;

$video = null;

ctx = null;

w = null;

h = null;

localMediaStream = null;

localMediaInterval = null;

started = false;

support = false;

showingCanvas = false;

Template._qrScanner.rendered = function() {
  var base, base1;
  showingCanvas = true;
  if (this.data == null) {
    this.data = {};
  }
  w = (base = this.data).w != null ? base.w : base.w = 640;
  h = (base1 = this.data).h != null ? base1.h : base1.h = 480;
  $canvas = $('#qr-canvas');
  $video = $('#qr-scanner-video')[0];
  return load();
};

Template._qrScanner.destroyed = function() {
  return stopCapture();
};

stopCapture = function() {
  var j, len, ref, track;
  if (localMediaStream) {
    ref = localMediaStream.getTracks();
    for (j = 0, len = ref.length; j < len; j++) {
      track = ref[j];
      track.stop();
    }
  }
  if (localMediaInterval) {
    Meteor.clearInterval(localMediaInterval);
    localMediaInterval = null;
  }
  showingCanvas = false;
  qrReactiveDict.set('message', null);
  return qrScanner.off('scan');
};

isCanvasSupported = function() {
  var elem;
  elem = document.createElement("canvas");
  return !!(elem.getContext && elem.getContext("2d"));
};

load = function() {
  var err;
  if (isCanvasSupported()) {
    initDom();
    return initWebcam();
  } else {
    err = 'Your browser does not support canvas';
    return console.log(err);
  }
};

initDom = function() {
  $canvas.width(w).attr('width', w);
  $canvas.height(h).attr('height', h);
  ctx = $canvas[0].getContext("2d");
  ctx.clearRect(0, 0, w, h);
};

initWebcam = function() {
  var optional_source, parseSources;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  started = true;
  if (navigator.getUserMedia) {
    optional_source = [];
    if (MediaStreamTrack.getSources) {
      MediaStreamTrack.getSources(function(sources) {
        return parseSources(sources);
      });
    } else if (navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(function(sources) {
        return parseSources(sources);
      });
    } else {
      support = false;
      console.log('Cannot get mediaStream sources');
    }
    return parseSources = function(sourceInfos) {
      var i, j, ref, sourceInfo;
      for (i = j = 0, ref = sourceInfos.length; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        sourceInfo = sourceInfos[i];
        if (sourceInfo.kind === 'video' && (sourceInfo.facing === '' || sourceInfo.facing === 'environment') || sourceInfo.kind === 'videoinput') {
          optional_source = [
            {
              sourceId: sourceInfo.id
            }
          ];
          break;
        }
      }
      return navigator.getUserMedia({
        video: {
          mandatory: {
            maxWidth: w,
            maxHeight: h
          },
          optional: optional_source
        },
        audio: false
      }, function(stream) {
        if (navigator.webkitGetUserMedia) {
          $video.src = window.URL.createObjectURL(stream);
        } else if (navigator.mozGetUserMedia) {
          $video.mozSrcObject = stream;
          $video.play();
        } else {
          $video.src = stream;
        }
        localMediaStream = stream;
        if (!localMediaInterval) {
          return localMediaInterval = Meteor.setInterval(captureToCanvas, 500);
        }
      }, function(err) {
        return console.log(err);
      });
    };
  } else {
    support = false;
    return console.log('Your borwser doesnt support getUserMedia');
  }
};

captureToCanvas = function() {
  var err, error, message;
  ctx.drawImage($video, 0, 0);
  try {
    message = qrcode.decode();
    qrReactiveDict.set('message', message);
    if (qrScanner.scan) {
      return qrScanner.scan(null, message);
    }
  } catch (error) {
    err = "The QR code isnt visible or couldn't be read";
    if (qrScanner.scan) {
      return qrScanner.scan(err, null);
    }
  }
};
