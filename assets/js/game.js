'use strict';

var map;
var resultmap;
var markers = [];
var guess_coordinates = [];
var true_location = [];

var accumulated_distance = 0;
var current_name = '';
var distance_from_guess = [];
var check_count = 0;

var choiceLocation = "HN"


const boundingBoxVN = {
  HN:     [105.7700, 20.9600, 105.8800, 21.0500, 0.0008],  // Hà Nội
  TPHCM:  [106.6200, 10.7100, 106.7500, 10.8300, 0.005],  // TP. Hồ Chí Minh
  HUE:    [107.5200, 16.4200, 107.6500, 16.5100, 0.005],  // Huế
  HP:     [106.6500, 20.8000, 106.7500, 20.9000, 0.05],  // Trung tâm Hải Phòng
  ND:     [106.0000, 20.3500, 106.2500, 20.5000, 0.005],
  DN:     [108.1700, 16.0000, 108.2500, 16.1000, 0.005],  // Đà Nẵng
};

var minLat = boundingBoxVN[choiceLocation][1];
var maxLat = boundingBoxVN[choiceLocation][3];
var minLong = boundingBoxVN[choiceLocation][0];
var maxLong = boundingBoxVN[choiceLocation][2];      

var delta = boundingBoxVN[choiceLocation][4];

const accessToken = 'MLY|24113623194974280|5bf83fa202912f1cc3210b2cf968fb65';

async function getRandomMapillaryImage() {
  
  // Generate a random point within the defined area
  const randomLat = (Math.random() * (maxLat - minLat) + minLat);
  const randomLng = (Math.random() * (maxLong - minLong) + minLong);

  const radius = 50;
  const limit = 50;
  const url = `https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,thumb_original_url,geometry,is_pano&lat=${randomLat.toFixed(6)}&lng=${randomLng.toFixed(6)}&radius=${radius}&limit=${limit}`;

  try {
    console.log('Fetching panoramic image...');
    const res = await fetch(url);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      // Filter for panoramic images first
      const panoramicImages = data.data.filter(img => img.is_pano);
      const image = panoramicImages.length > 0 ? panoramicImages[Math.floor(Math.random() * panoramicImages.length)] : data.data[0];
      
      console.log('Image fetched successfully');
      return {
        lat: image.geometry.coordinates[1],
        lng: image.geometry.coordinates[0],
        url: image.thumb_original_url,
        id: image.id,
        isPano: image.is_pano || false
      };
    } else {
      console.log('No images found, retrying...');
      return getRandomMapillaryImage();
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    // Show error in loading area
    document.getElementById('pano').innerHTML = `
      <div style="width:100%; height:400px; display:flex; justify-content:center; align-items:center; ">
        <div style="text-align:center; color: #e74c3c;">
          <div style="font-size: 18px; margin-bottom: 10px;">⚠️ Error loading image</div>
          <div style="font-size: 14px;">Retrying...</div>
        </div>
      </div>
    `;
    // Retry after a short delay
    setTimeout(() => getRandomMapillaryImage(), 2000);
  }
}

function checkLibrariesLoaded() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (window.L && window.PhotoSphereViewer) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

function showLoading() {
  document.getElementById('pano').innerHTML = `
    <div style="width:100%; height:400px; display:flex; justify-content:center; align-items:center; ">
      <div style="text-align:center;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 15px;"></div>
        <div style="color: #666; font-size: 16px;">Loading image...</div>
      </div>
    </div>
  `;
  
  // Add CSS animation for spinner
  if (!document.getElementById('loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

function hideLoading() {
  // Remove loading indicator
  const panoElement = document.getElementById('pano');
  if (panoElement && panoElement.innerHTML.includes('Loading image...')) {
    panoElement.innerHTML = '';
  }
}

function initialize() {
  check_count = 0;
  disableButton('check');
  
  // Show loading indicator
  showLoading();

  getRandomMapillaryImage().then(image => {
    if (!image) return location.reload();
    true_location = [image.lat, image.lng];
    current_name = "VIET NAM";
    document.getElementById('pano').innerHTML = ""; // Clear any existing content

    try {
      if (window.PhotoSphereViewer && window.PhotoSphereViewer.Viewer) {
        // Hide loading before initializing viewer
        hideLoading();
        
        const viewer = new PhotoSphereViewer.Viewer({
          container: document.getElementById('pano'),
          panorama: image.url,
          loadingImg: null,
          defaultYaw: 0,
          defaultZoomLvl: -96,
          navbar: [
            'zoom',
            'fullscreen'
          ],
          mousewheel: true,
          touchmoveTwoFingers: true,
        });
        
        // Add event listeners for loading states
        viewer.addEventListener('ready', () => {
          console.log('Photo Sphere Viewer loaded successfully');
        });
        
        viewer.addEventListener('panorama-loaded', () => {
          console.log('Panorama image loaded');
        });
        
        viewer.addEventListener('panorama-error', (error) => {
          console.error('Error loading panorama:', error);
          // Fallback to regular image on panorama load error
          hideLoading();
          document.getElementById('pano').innerHTML = `<img src="${image.url}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;" />`;
        });
        
      } else {
        console.warn('PhotoSphereViewer not available, using fallback image');
        hideLoading();
        document.getElementById('pano').innerHTML = `<img src="${image.url}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;" />`;
      }
    } catch (error) {
      console.error('Error initializing Photo Sphere Viewer:', error);
      // Fallback to regular image
      hideLoading();
      document.getElementById('pano').innerHTML = `<img src="${image.url}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;" />`;
    }


    map = L.map('map').setView([(minLat + maxLat) / 2, (minLong + maxLong) / 2], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    map.on('click', function(e) {
      deleteMarkers();
      guess_coordinates = [e.latlng.lat, e.latlng.lng];
      const marker = L.marker(e.latlng).addTo(map);
      markers.push(marker);
      if (check_count === 0) {
        enableButton('check');
        check_count += 1;
      }
    });
  }).catch(error => {
    console.error('Error in initialize function:', error);
    document.getElementById('pano').innerHTML = `
      <div style="width:100%; height:400px; display:flex; justify-content:center; align-items:center;">
        <div style="text-align:center; color: #e74c3c;">
          <div style="font-size: 18px; margin-bottom: 10px;">⚠️ Failed to load</div>
          <button onclick="location.reload()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
        </div>
      </div>
    `;
  });
}

function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    map.removeLayer(markers[i]);
  }
  markers = [];
}

function deleteMarkers() {
  clearMarkers();
}

function continueGame() {
  var resModal = new bootstrap.Modal(document.getElementById('resultModal'));
  resModal.hide();
  location.reload();
}

function check() {
  distance_from_guess = [];
  var guess_error = distance(guess_coordinates[0], guess_coordinates[1], true_location[0], true_location[1], 'M');
  accumulated_distance += parseFloat(guess_error);
  distance_from_guess = guess_error;

  showResultModal(distance_from_guess);

  disableButton('check');
}

function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  } else {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) +
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) dist = 1;

    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;

    if (unit == "K") dist = dist * 1.609344;
    if (unit == "N") dist = dist * 0.8684;

    dist = dist * 1609.34;
    return dist.toFixed(1);
  }
}

function display_location() {
  const scoreText = document.getElementById("score");
  if (distance_from_guess > 1000)
    scoreText.innerHTML = `Hmm! Your distance is ${distance_from_guess}m away.`;
  else if (distance_from_guess > 200)
    scoreText.innerHTML = `Good job! Your distance is ${distance_from_guess}m away.`;
  else
    scoreText.innerHTML = `Excellent! Your distance is ${distance_from_guess}m away.`;
}

function disableButton(id) {
  document.getElementById(id).disabled = true;
}

function enableButton(id) {
  document.getElementById(id).disabled = false;
}

function showResultModal(distanceKm) {
  const modal = document.getElementById("resultModal");
  const scoreText = document.getElementById("resultText");
  const distanceText = document.getElementById("distance-guess");

  if (distance_from_guess > 1000)
    distanceText.innerHTML = `${(distance_from_guess / 1000).toFixed(2)} KM`;
  else 
    distanceText.innerHTML = `${distance_from_guess} M`;
  // Update the score text
  if (distance_from_guess > 1000)
    scoreText.innerHTML = `Hmm! Nice try.`;
  else if (distance_from_guess > 200)
    scoreText.innerHTML = `Good job!`;
  else
    scoreText.innerHTML = `Excellent!`;
  
  // Show the modal
  modal.style.display = "block";
  
  // Create the result map
  createResultMap();
}

function createResultMap() {
  // Clear any existing map
  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = '';
  
  var result_map = L.map('result').setView(true_location, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(result_map);

  // Invalidate map size to ensure proper rendering
  setTimeout(() => {
    result_map.invalidateSize();
  }, 100);

  const true_marker = L.marker(true_location, {
    icon: L.icon({
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      iconSize: [32, 32],
    })
  }).addTo(result_map).bindPopup(current_name);

  const guess_marker = L.marker(guess_coordinates, {
    icon: L.icon({
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      iconSize: [32, 32],
    })
  }).addTo(result_map).bindPopup("Your Guess");

  const polyline = L.polyline([true_location, guess_coordinates], { color: 'blue', dashArray: '5, 10' }).addTo(result_map);

  // Fit map to show both markers
  const group = new L.featureGroup([true_marker, guess_marker]);
  result_map.fitBounds(group.getBounds().pad(0.1));
}

function closeResultModal() {
  document.getElementById("resultModal").style.display = "none";
}


function nextRound() {
  closeResultModal();
  // Logic để reset game hoặc sang round tiếp theo
  location.reload();
}

function goBack() {
  // Logic để quay lại trang chính hoặc trang lựa chọn
  window.location.href = '/';
}


function showDonateModal() {
  const modal = document.getElementById("donateModal");

  // Show the modal
  modal.style.display = "block";

}

function closeDonate() {
  const modal = document.getElementById("donateModal");
  // Hide the modal
  modal.style.display = "none";
  // Optionally, you can reset the game or perform other actions
}


window.onload = function () {
  // Get location parameter from URL before initializing
  const params = new URLSearchParams(window.location.search);
  const locationParam = params.get("location");
  if (locationParam) {
    choiceLocation = locationParam;
  }
  minLat = boundingBoxVN[choiceLocation][1];
  maxLat = boundingBoxVN[choiceLocation][3];
  minLong = boundingBoxVN[choiceLocation][0];
  maxLong = boundingBoxVN[choiceLocation][2];      
  delta = boundingBoxVN[choiceLocation][4];
  
  checkLibrariesLoaded().then(() => {
    initialize();
  });
};

