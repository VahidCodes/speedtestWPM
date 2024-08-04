const textDisplay = document.getElementById('text-display');
        const textInput = document.getElementById('text-input');
        const wpmElement = document.getElementById('wpm');
        const startButton = document.getElementById('start-button');
        const saveButton = document.getElementById('save-button');
        const errorNotification = document.getElementById('error-notification');
        const wpmMessage = document.getElementById('wpm-message');
        const progressBar = document.getElementById('progress');
        const themeToggle = document.getElementById('toggle');
        const body = document.body;
        const container = document.querySelector('.container');
        const clock = document.getElementById('clock');
        const hourHand = document.querySelector('.hour-hand');
        const minuteHand = document.querySelector('.minute-hand');
        const secondHand = document.querySelector('.second-hand');
        const resultsList = document.getElementById('results-list');
        const timerDisplay = document.getElementById('timer');

        let availableWords = [];
        let usedWords = [];
        let time = 60;
        let timer;
        let started = false;
        let errors = 0;
        let wordsTyped = 0;

        startButton.addEventListener('click', startTest);
        saveButton.addEventListener('click', saveResult);
        themeToggle.addEventListener('change', toggleTheme);

        function toggleTheme() {
            if (themeToggle.checked) {
                body.classList.add('dark-mode');
                body.classList.remove('light-mode');
                container.classList.add('dark-mode');
                container.classList.remove('light-mode');
            } else {
                body.classList.add('light-mode');
                body.classList.remove('dark-mode');
                container.classList.add('light-mode');
                container.classList.remove('dark-mode');
            }
        }

        async function fetchWords() {
            try {
                const response = await fetch('https://random-word-api.herokuapp.com/word?number=100');
                const data = await response.json();
                return data.filter(word => word.length <= 10); // Filter for simpler words
            } catch (error) {
                console.error('Error fetching words:', error);
                return [];
            }
        }

        function updateClock() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            const hourDegrees = (hours % 12) * 30 + minutes * 0.5;
            const minuteDegrees = minutes * 6 + seconds * 0.1;
            const secondDegrees = seconds * 6;

            hourHand.style.transform = `translateX(-50%) rotate(${hourDegrees}deg)`;
            minuteHand.style.transform = `translateX(-50%) rotate(${minuteDegrees}deg)`;
            secondHand.style.transform = `translateX(-50%) rotate(${secondDegrees}deg)`;
        }

        function updateTimer() {
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        async function startTest() {
            if (started) return;
            started = true;
            textInput.value = '';
            errors = 0;
            wordsTyped = 0;
            textInput.disabled = false;
            textInput.focus();
            time = 60;
            errorNotification.textContent = '';
            wpmMessage.textContent = '';
            progressBar.style.width = '100%';
            availableWords = await fetchWords();
            usedWords = [];
            setNewWord();
            timer = setInterval(() => {
                updateClock();
                updateTimer();
                if (time > 0) time--;
                if (time === 0) {
                    clearInterval(timer);
                    endTest();
                }
            }, 1000);
            textInput.addEventListener('input', checkInput);
        }

        function checkInput() {
            const inputText = textInput.value.trim().toLowerCase();
            const displayedText = textDisplay.textContent.toLowerCase();
            if (inputText === displayedText) {
                wordsTyped++;
                textInput.value = '';
                setNewWord();
            } else if (inputText && inputText !== displayedText.substring(0, inputText.length)) {
                errors++;
                errorNotification.textContent = `Errors: ${errors}`;
            }
            updateWPM();
        }

        function setNewWord() {
            if (availableWords.length === 0) {
                availableWords = [...usedWords];
                usedWords = [];
            }
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            const newWord = availableWords.splice(randomIndex, 1)[0];
            usedWords.push(newWord);
            textDisplay.textContent = newWord;
        }

        function updateWPM() {
            const wpm = Math.round((wordsTyped / (60 - time)) * 60);
            wpmElement.textContent = `${wpm} WPM`;
        }

        function endTest() {
            started = false;
            textInput.disabled = true;
            textInput.removeEventListener('input', checkInput);
            const wpm = parseInt(wpmElement.textContent);
            let message;
            if (wpm >= 70) {
                message = 'High Speed';
            } else if (wpm >= 60) {
                message = 'Productive Speed';
            } else if (wpm >= 50) {
                message = 'Above Average Speed';
            } else if (wpm >= 40) {
                message = 'Average Speed';
            } else {
                message = 'Below Average Speed';
            }
            wpmMessage.textContent = `Your WPM is ${wpm}. ${message}`;
            alert(`Time is up! Your WPM is ${wpm}. ${message}`);

            // Automatically save the result
            saveResult();
        }

        function saveResult() {
            if (!started) {
                // Only save if the test was completed
                const wpm = parseInt(wpmElement.textContent);
                const results = JSON.parse(localStorage.getItem('typingTestResults')) || [];
                results.push({
                    date: new Date().toLocaleString(),
                    wpm: wpm,
                    errors: errors
                });
                localStorage.setItem('typingTestResults', JSON.stringify(results));
                displayResults();
            }
        }

        function displayResults() {
            const results = JSON.parse(localStorage.getItem('typingTestResults')) || [];
            resultsList.innerHTML = results.map((result, index) => `
                <li>
                    <strong>Date:</strong> ${result.date} <br>
                    <strong>WPM:</strong> ${result.wpm} <br>
                    <strong>Errors:</strong> ${result.errors}
                    <button class="remove-button" onclick="removeResult(${index})">Remove</button>
                </li>
            `).join('');
        }

        function removeResult(index) {
            const results = JSON.parse(localStorage.getItem('typingTestResults')) || [];
            results.splice(index, 1);
            localStorage.setItem('typingTestResults', JSON.stringify(results));
            displayResults();
        }

        // Initial call to display previous results on page load
        displayResults();
