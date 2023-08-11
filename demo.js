window.addEventListener('load', () => {
  // Check to see if the API is supported.
  if ('getInstalledRelatedApps' in navigator) {
    checkForRelatedApps();
  } else {
    alert('Error: there is no getInstalledRelatedApps in navigator!');
  }
});

function checkForRelatedApps() {
  navigator.getInstalledRelatedApps()
    .then((relatedApps) => {
        alert(`resolved (${relatedApps.length})`);
    })
    .catch(error => {
        alert('error: ' + error);
    })
    ;
}
  

