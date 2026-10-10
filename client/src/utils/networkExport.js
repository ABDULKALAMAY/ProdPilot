// Export the complete SVG, including branches outside the scrolling viewport.
export async function downloadNetworkPng(svg, filename = 'project-network.png') {
  if (!svg) throw new Error('The project network is not ready.');
  const copy = svg.cloneNode(true);
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const originals = [svg, ...svg.querySelectorAll('*')];
  const copies = [copy, ...copy.querySelectorAll('*')];
  const properties = ['fill', 'stroke', 'stroke-width', 'stroke-linejoin', 'stroke-linecap',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'opacity'];
  originals.forEach((element, index) => {
    const style = getComputedStyle(element);
    properties.forEach((property) => copies[index].style.setProperty(property, style.getPropertyValue(property)));
  });
  const { width, height } = svg.viewBox.baseVal;
  // Keep large networks within a reasonable canvas memory budget.
  const scale = Math.min(2, Math.sqrt(16000000 / (width * height)), 8192 / width, 8192 / height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PNG export is not supported in this browser.');
  const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Could not render the network image. Please try again.'));
      image.src = svgUrl;
    });
    context.fillStyle = '#f7f9f5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!png) throw new Error('Could not create the PNG file.');
    const pngUrl = URL.createObjectURL(png);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
