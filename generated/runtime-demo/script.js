let isDarkMode = false;

function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
}

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle Dark Mode';
  toggleButton.onclick = toggleDarkMode;
  document.body.appendChild(toggleButton);
})