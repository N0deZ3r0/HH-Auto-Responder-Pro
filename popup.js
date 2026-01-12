// popup.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup загружен');
    
    // Сразу показываем базовый статус
    updateStatus('✅ Расширение активировано', '✅');
    
    // Проверяем подключение к странице
    checkConnection();
});

// Обновить статус в popup
function updateStatus(text, icon = '✅') {
    const statusElement = document.getElementById('status');
    const statusIcon = document.getElementById('statusIcon');
    const dots = document.getElementById('connectionDots');
    
    if (statusElement) {
        statusElement.textContent = text;
        statusElement.className = 'status-text ' + 
            (text.includes('✅') || text.includes('Расширение активировано') ? 'status-connected' : 'status-disconnected');
    }
    
    if (statusIcon) {
        statusIcon.textContent = icon;
    }
    
    if (dots) {
        dots.style.display = text.includes('Проверка') ? 'flex' : 'none';
    }
}

// Проверить подключение к странице
async function checkConnection() {
    // Показываем статус проверки
    updateStatus('🔍 Проверка подключения...', '🔍');
    
    try {
        const [tab] = await chrome.tabs.query({ 
            active: true, 
            currentWindow: true 
        });
        
        if (!tab || !tab.url || !tab.url.includes('hh.ru')) {
            updateStatus('🌐 Откройте страницу HH.ru', '🌐');
            return;
        }
        
        // Пробуем отправить сообщение
        try {
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'checkConnection'
            });
            
            if (response && response.connected) {
                updateStatus('✅ Расширение активировано', '✅');
            } else {
                updateStatus('⚠️ Обновите страницу HH.ru', '⚠️');
            }
        } catch (error) {
            console.log('Content script не отвечает:', error);
            updateStatus('⚠️ Обновите страницу HH.ru', '⚠️');
        }
        
    } catch (error) {
        console.log('Ошибка подключения:', error);
        updateStatus('❌ Ошибка подключения', '❌');
    }
}

// При клике на popup проверяем соединение
document.body.addEventListener('click', function() {
    checkConnection();
});

// Проверяем каждые 30 секунд если popup открыт
setInterval(checkConnection, 30000);