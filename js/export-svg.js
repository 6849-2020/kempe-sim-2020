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

  for (var e in traceHistoryEdges) {
    for (var i = 0; i < traceHistoryEdges[e].length; i++) {
      for (var j = 0; j < 4; j += 2) {
        var x = sx * traceHistoryEdges[e][i][j];
        var y = sy * traceHistoryEdges[e][i][j + 1];
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
  }

  var width = maxX - minX;
  var height = maxY - minY;

  if (width < 0 || height < 0) {
    globals.warn("No drawing to export!")
    return
  }

  var ctx2Svg = new C2S(width, height);
  ctx2Svg.translate(-minX, -minY);

  ctx2Svg.fillStyle = 'white'
  // ctx2Svg.fillRect(0, 0, width, height);

  var e_idx = 0;
  for (var e in traceHistoryEdges) {
    ctx2Svg.fillStyle = traceColors[e_idx % traceColors.length];
    ctx2Svg.beginPath();
    // relative positions because trace should move when we move the linkage
    ctx2Svg.moveTo(sx*traceHistoryEdges[e][0][0], sy*traceHistoryEdges[e][0][1]);
    for (var i = 1; i < traceHistoryEdges[e].length; i++) {
      ctx2Svg.lineTo(sx*traceHistoryEdges[e][i][0], sy*traceHistoryEdges[e][i][1]);
    }
    ctx2Svg.lineTo(sx*traceHistoryEdges[e][traceHistoryEdges[e].length-1][2], sy*traceHistoryEdges[e][traceHistoryEdges[e].length-1][3]);
    for (var i = traceHistoryEdges[e].length - 2; i >= 0; i--) {
      ctx2Svg.lineTo(sx*traceHistoryEdges[e][i][2], sy*traceHistoryEdges[e][i][3]);
    }
    ctx2Svg.closePath();
    ctx2Svg.fill();
    e_idx += 1;
  }

  var p_idx = 0;
  for (var p in traceHistory) {
    ctx2Svg.lineWidth = 1;
    ctx2Svg.strokeStyle = traceColors[p_idx % traceColors.length];
    ctx2Svg.beginPath();
    // relative positions because trace should move when we move the linkage
    ctx2Svg.moveTo(sx*traceHistory[p][0][0], sy*traceHistory[p][0][1]);
    for (var i = 1; i < traceHistory[p].length; i++) {
      ctx2Svg.lineTo(sx*traceHistory[p][i][0], sy*traceHistory[p][i][1]);
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
