function exportToSvg(globals) {
  if (!traceHistory) {
    globals.warn("No drawing to export!")
    return
  }
  var minX = 1000;
  var maxX = -1000;
  var minY = 1000;
  var maxY = -1000;

  for (var p in traceHistory) {
    for (var i = 0; i < traceHistory[p].length; i++) {
      var x = sx * traceHistory[p][i][0];
      var y = sy * traceHistory[p][i][1];
      if (x < minX)
        minX = x;
      if (x > maxX)
        maxX = x;
      if (y < minY)
        minY = y;
      if (y > maxY)
        maxY = y;
    }
  }

  var width = maxX - minX;
  var height = maxY - minY;

  var ctx2Svg = new C2S(width, height);

  ctx2Svg.fillStyle = 'white'
  // ctx2Svg.fillRect(0, 0, width, height);

  var p_idx = 0;
  var colors = ["red", "green", "blue", "yellow", "magenta", "cyan"];
  for (var p in traceHistory) {
    ctx2Svg.lineWidth = 1;
    ctx2Svg.strokeStyle = colors[p_idx % colors.length];
    ctx2Svg.beginPath();
    // relative positions because trace should move when we move the linkage
    ctx2Svg.moveTo(sx*traceHistory[p][0][0] - minX, sy*traceHistory[p][0][1] - minY);
    for (var i = 1; i < traceHistory[p].length; i++) {
      ctx2Svg.lineTo(sx*traceHistory[p][i][0] - minX, sy*traceHistory[p][i][1] - minY);
    }
    ctx2Svg.stroke();
    p_idx += 1;
  }

  var mySerializedSVG = ctx2Svg.getSerializedSvg();

  var dataStr = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(mySerializedSVG);
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", "linkage.svg");
  dlAnchorElem.click();
}

function exportToCsv(globals) {
  var csv = "";

  var p_idx = 0;
  var colors = ["red", "green", "blue", "yellow", "magenta", "cyan"];
  for (var p in traceHistory) {
    csv += "PEN" + p_idx + ",,\n";
    for (var i = 0; i < traceHistory[p].length; i++) {
      csv += traceHistory[p][i][0] + "," + traceHistory[p][i][1] + ",0\n";
    }
    p_idx += 1;
  }

  var dataStr = "data:text.csv;charset=utf-8," + encodeURIComponent(csv);
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", "linkage.csv");
  dlAnchorElem.click();
}
