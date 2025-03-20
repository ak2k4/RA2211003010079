const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;

const NUMBER_API_MAP = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
};

const TEST_SERVER_URL = "http://20.244.56.144/test/";
const WINDOW_SIZE = 10;
let numberWindow = [];

async function fetchNumbers(type) {
    const url = `${TEST_SERVER_URL}${type}`;

    try {
        const response = await axios.get(url, { timeout: 500 });
        return response.data.numbers || [];
    } catch (error) {
        console.error(`Error fetching ${type} numbers:`, error.message);
        return [];
    }
}

function updateWindow(newNumbers) {
    let windowPrevState = [...numberWindow];

    newNumbers.forEach(num => {
        if (!numberWindow.includes(num)) {
            if (numberWindow.length >= WINDOW_SIZE) {
                numberWindow.shift(); 
            }
            numberWindow.push(num);
        }
    });

    return windowPrevState;
}


function calculateAverage() {
    if (numberWindow.length === 0) return 0;
    let sum = numberWindow.reduce((acc, num) => acc + num, 0);
    return parseFloat((sum / numberWindow.length).toFixed(2));
}

app.get('/numbers/:numberid', async (req, res) => {
    const numberType = req.params.numberid;
    
    if (!NUMBER_API_MAP[numberType]) {
        return res.status(400).json({ error: "Invalid number type. Use 'p', 'f', 'e', or 'r'." });
    }

    const receivedNumbers = await fetchNumbers(NUMBER_API_MAP[numberType]);

    const windowPrevState = updateWindow(receivedNumbers);
    const avg = calculateAverage();

    res.json({
        windowPrevState,
        windowCurrState: numberWindow,
        numbers: receivedNumbers,
        avg
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
