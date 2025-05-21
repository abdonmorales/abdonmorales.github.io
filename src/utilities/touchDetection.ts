// Utility to detect touch devices and improve interaction

export function setupTouchDetection() {
  // Add a class to the body when touch is used for better CSS targeting
  document.addEventListener('touchstart', function handleFirstTouch() {
    document.body.classList.add('touch-device');
    
    // Remove listener after first touch to avoid unnecessary processing
    document.removeEventListener('touchstart', handleFirstTouch);
  });
  
  // Improve focus states for accessibility
  document.addEventListener('mousedown', function() {
    document.body.classList.add('using-mouse');
  });
  
  document.addEventListener('keydown', function() {
    document.body.classList.remove('using-mouse');
  });
}
