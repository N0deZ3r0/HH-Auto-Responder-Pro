// ===== HH АВТО-ОТКЛИК =====
(function() {
    'use strict';
    
    console.log('=== HH Авто-отклик v1.1 ===');
    
    if (!window.location.href.includes('hh.ru')) {
        console.log('⚠️ Не страница HH.ru, скрипт не активирован');
        return;
    }
    
    class HHAutoResponder {
        constructor() {
            this.coverLetter = `Добрый день!Заинтересовала ваша вакансия.Мой опыт соответствует требованиям.Готов(а) к собеседованию.С уважением,[Ваше Имя]`;
            this.isRunning = false;
            this.processedVacancies = new Set();
            this.stats = { success: 0, failed: 0, skipped: 0, total: 0 };
            this.settings = { 
                autoNextPage: true, 
                skipResponded: true, 
                delay: 0.5, // Уменьшено с 1 до 0.5 секунд
                filterOrganizations: true,
                autoRememberOrganizations: true
            };
            this.filteredOrganizations = [];
            this.autoFilteredOrganizations = [];
            this.theme = 'dark';
            
            window.hhAutoResponder = this;
            
            this.init();
        }
        
        init() {
            console.log('🎯 Инициализация HH Авто-отклика...');
            
            this.loadSettings();
            this.createInterface();
            this.setupEventListeners();
            
            console.log('✅ HH Авто-отклик готов к работе!');
            this.updateStatus('✅ Готов к работе на этой странице');
        }
        
        loadSettings() {
            try {
                const saved = localStorage.getItem('hh-auto-settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.coverLetter) this.coverLetter = parsed.coverLetter;
                    if (parsed.settings) this.settings = { ...this.settings, ...parsed.settings };
                    if (parsed.stats) this.stats = { ...this.stats, ...parsed.stats };
                    if (parsed.theme) this.theme = parsed.theme;
                    if (parsed.filteredOrganizations) this.filteredOrganizations = parsed.filteredOrganizations;
                    if (parsed.autoFilteredOrganizations) this.autoFilteredOrganizations = parsed.autoFilteredOrganizations;
                }
            } catch (e) {
                console.log('Используем настройки по умолчанию');
            }
        }
        
        saveSettings() {
            try {
                localStorage.setItem('hh-auto-settings', JSON.stringify({
                    coverLetter: this.coverLetter,
                    settings: this.settings,
                    stats: this.stats,
                    theme: this.theme,
                    filteredOrganizations: this.filteredOrganizations,
                    autoFilteredOrganizations: this.autoFilteredOrganizations
                }));
            } catch (e) {
                console.log('Не удалось сохранить настройки');
            }
        }
        
        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        createInterface() {
            this.removeOldInterface();
            this.createPanel();
            this.createToggleButton();
            this.updateCount();
            this.updateStatsDisplay();
        }
        
        removeOldInterface() {
            const oldPanel = document.getElementById('hh-auto-panel');
            if (oldPanel) oldPanel.remove();
            
            const oldBtn = document.getElementById('hh-toggle-btn');
            if (oldBtn) oldBtn.remove();
        }
        
        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'hh-auto-panel';
            
            const isDark = this.theme === 'dark';
            const bgColor = isDark ? '#1e1e1e' : 'white';
            const textColor = isDark ? '#ffffff' : '#333333';
            const borderColor = isDark ? '#444444' : '#4CAF50';
            const statusBg = isDark ? '#2d2d2d' : '#f0f8ff';
            const statusColor = isDark ? '#ffffff' : '#333333';
            const secondaryText = isDark ? '#aaaaaa' : '#666666';
            const inputBg = isDark ? '#2d2d2d' : 'white';
            const inputBorder = isDark ? '#555555' : '#dddddd';
            
            Object.assign(this.panel.style, {
                position: 'fixed',
                top: '110px',
                right: '20px',
                zIndex: '10000',
                background: bgColor,
                color: textColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '10px',
                padding: '15px',
                width: '340px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                fontFamily: 'Arial, sans-serif',
                maxHeight: '80vh',
                overflowY: 'auto',
                transition: 'all 0.3s'
            });
            
            this.panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <h3 style="margin: 0; color: #2196F3; font-size: 16px;">HH Авто-отклик</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span id="hh-moon-icon" style="font-size: 14px; color: ${isDark ? '#4CAF50' : '#666'}; transition: all 0.3s;">☀️</span>
                            <div id="hh-theme-slider" style="position: relative; width: 44px; height: 20px; cursor: pointer; border-radius: 12px; background: ${isDark ? '#2d2d2d' : '#e0e0e0'}; transition: all 0.3s; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                                <div id="hh-theme-slider-handle" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: ${isDark ? '#4CAF50' : '#FF9800'}; border-radius: 50%; transition: all 0.3s; transform: ${isDark ? 'translateX(22px)' : 'translateX(2px)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                </div>
                            </div>
                            <span id="hh-sun-icon" style="font-size: 14px; color: ${isDark ? '#aaa' : '#FF9800'}; transition: all 0.3s;">🌙</span>
                        </div>
                        <button id="hh-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: ${secondaryText}; padding: 2px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;" title="Скрыть панель">
                            ×
                        </button>
                    </div>
                </div>
                
                <div id="hh-status" style="background: ${statusBg}; color: ${statusColor}; padding: 10px; border-radius: 6px; font-size: 13px; min-height: 50px; margin-bottom: 10px; border: 1px solid ${inputBorder};">
                    ✅ Готов к работе
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div style="font-size: 12px; color: ${secondaryText};">
                        🔍 Найдено: <span id="hh-count" style="font-weight: bold; color: ${textColor};">0</span>
                    </div>
                    <div id="hh-stats" style="font-size: 11px; color: ${secondaryText}; background: ${isDark ? '#2d2d2d' : '#f5f5f5'}; padding: 4px 8px; border-radius: 4px; border: 1px solid ${inputBorder};">
                        ✅0 ❌0 ⏭️0
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 13px; margin-bottom: 5px; color: ${textColor};">📝 Сопроводительное письмо:</div>
                    <textarea id="hh-letter" style="width: 100%; height: 100px; padding: 8px; border: 1px solid ${inputBorder}; border-radius: 4px; font-size: 13px; resize: vertical; background: ${inputBg}; color: ${textColor};">${this.coverLetter}</textarea>
                    <div style="font-size: 11px; color: ${secondaryText}; margin-top: 3px; display: flex; justify-content: space-between;">
                        <span>* Укажите своё настоящее имя</span>
                        <span id="hh-char-count">${this.coverLetter.length}/2000</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 13px; margin: 10px 0 5px 0; color: ${textColor};">⚙️ Настройки:</div>
                    <label style="display: flex; align-items: center; font-size: 13px; margin-bottom: 5px; color: ${textColor}; cursor: pointer;">
                        <input type="checkbox" id="hh-auto-next" ${this.settings.autoNextPage ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                        Автопереход на следующую страницу
                    </label>
                    <label style="display: flex; align-items: center; font-size: 13px; margin-bottom: 5px; color: ${textColor}; cursor: pointer;">
                        <input type="checkbox" id="hh-skip-responded" ${this.settings.skipResponded ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                        Пропускать уже откликнутые
                    </label>
                    <label style="display: flex; align-items: center; font-size: 13px; margin-bottom: 5px; color: ${textColor}; cursor: pointer;">
                        <input type="checkbox" id="hh-filter-organizations" ${this.settings.filterOrganizations ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                        Фильтровать организации
                    </label>
                    <label style="display: flex; align-items: center; font-size: 13px; margin-bottom: 5px; color: ${textColor}; cursor: pointer;">
                        <input type="checkbox" id="hh-auto-remember" ${this.settings.autoRememberOrganizations ? 'checked' : ''} style="margin-right: 8px; cursor: pointer;">
                        <strong>Автодобавление в фильтр</strong>
                    </label>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; color: ${textColor};">
                        <span style="font-size: 13px;">Задержка (сек):</span>
                        <input type="number" id="hh-delay" min="0.3" max="5" step="0.1" value="${this.settings.delay}" style="width: 50px; padding: 4px; border: 1px solid ${inputBorder}; border-radius: 4px; background: ${inputBg}; color: ${textColor}; text-align: center;">
                    </div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <div style="font-weight: bold; font-size: 13px; margin-bottom: 5px; color: ${textColor};">🚫 Фильтр организаций (ручной):</div>
                    <textarea id="hh-filter-text" placeholder="Введите названия организаций через запятую\nПример: Яндекс, Google, YouTube" style="width: 100%; height: 80px; padding: 8px; border: 1px solid ${inputBorder}; border-radius: 4px; font-size: 13px; resize: vertical; background: ${inputBg}; color: ${textColor};">${this.filteredOrganizations.length > 0 ? this.filteredOrganizations.join(', ') : ''}</textarea>
                    <div style="font-size: 11px; color: ${secondaryText}; margin-top: 3px;">
                        * Не откликаться на эти организации
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px; margin: 15px 0 10px 0;">
                    <button id="hh-start" style="padding: 12px; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>▶️</span>
                            <span>НАЧАТЬ АВТО-ОТКЛИК</span>
                        </span>
                    </button>
                    <button id="hh-test" style="padding: 10px; background: linear-gradient(135deg, #FF9800, #f57c00); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>🧪</span>
                            <span>Тест на 1 вакансию</span>
                        </span>
                    </button>
                    <button id="hh-stop" style="padding: 12px; background: linear-gradient(135deg, #f44336, #d32f2f); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: none;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>⏹️</span>
                            <span>ОСТАНОВИТЬ</span>
                        </span>
                    </button>
                </div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button id="hh-analyze" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>📊</span>
                            <span>Анализ</span>
                        </span>
                    </button>
                    <button id="hh-test-filter" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>🔍</span>
                            <span>Тест фильтра</span>
                        </span>
                    </button>
                    <button id="hh-show-auto-filter" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #00BCD4, #0097A7); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>🤖</span>
                            <span>Автофильтр</span>
                        </span>
                    </button>
                </div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button id="hh-clear" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #607D8B, #455a64); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>🗑️</span>
                            <span>Очистить</span>
                        </span>
                    </button>
                    <button id="hh-clear-auto-filter" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #f44336, #d32f2f); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>🧹</span>
                            <span>Очистить автофильтр</span>
                        </span>
                    </button>
                </div>
                
                <div style="margin-top: 15px; font-size: 11px; color: ${secondaryText}; text-align: center; border-top: 1px solid ${inputBorder}; padding-top: 10px;">
                    By ALEX
                </div>
            `;
            
            document.body.appendChild(this.panel);
        }
        
        createToggleButton() {
            this.toggleButton = document.createElement('button');
            this.toggleButton.id = 'hh-toggle-btn';
            this.toggleButton.innerHTML = '🚀';
            
            const isDark = this.theme === 'dark';
            const btnBg = isDark ? 'linear-gradient(135deg, #333, #555)' : 'linear-gradient(135deg, #2196F3, #1976D2)';
            
            Object.assign(this.toggleButton.style, {
                position: 'fixed',
                top: '50px',
                right: '20px',
                zIndex: '9999',
                background: btnBg,
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '24px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            });
            
            document.body.appendChild(this.toggleButton);
        }
        
        setupEventListeners() {
            this.toggleButton.addEventListener('click', () => {
                this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
            });
            
            document.getElementById('hh-close-btn').addEventListener('click', () => {
                this.panel.style.display = 'none';
            });
            
            // Исправленный переключатель темы
            const themeSlider = document.getElementById('hh-theme-slider');
            if (themeSlider) {
                themeSlider.addEventListener('click', () => {
                    this.toggleTheme();
                    this.applyThemeWithoutReload();
                });
            }
            
            document.getElementById('hh-start').addEventListener('click', () => this.startAutoProcess());
            document.getElementById('hh-test').addEventListener('click', () => this.testProcess());
            document.getElementById('hh-stop').addEventListener('click', () => this.stopAutoProcess());
            document.getElementById('hh-analyze').addEventListener('click', () => this.analyzePage());
            document.getElementById('hh-test-filter').addEventListener('click', () => this.testFilter());
            document.getElementById('hh-show-auto-filter').addEventListener('click', () => this.showAutoFilter());
            document.getElementById('hh-clear').addEventListener('click', () => this.clearHistory());
            document.getElementById('hh-clear-auto-filter').addEventListener('click', () => this.clearAutoFilter());
            
            document.getElementById('hh-auto-remember').addEventListener('change', (e) => {
                this.settings.autoRememberOrganizations = e.target.checked;
                this.saveSettings();
                this.updateStatus(e.target.checked ? 
                    '✅ АВТОфильтр ВКЛЮЧЕН - организации будут добавляться автоматически' : 
                    '⭕ АВТОфильтр выключен');
            });
            
            document.getElementById('hh-letter').addEventListener('input', (e) => {
                this.coverLetter = e.target.value;
                document.getElementById('hh-char-count').textContent = `${e.target.value.length}/2000`;
                this.saveSettings();
            });
            
            document.getElementById('hh-auto-next').addEventListener('change', (e) => {
                this.settings.autoNextPage = e.target.checked;
                this.saveSettings();
            });
            
            document.getElementById('hh-skip-responded').addEventListener('change', (e) => {
                this.settings.skipResponded = e.target.checked;
                this.saveSettings();
            });
            
            document.getElementById('hh-filter-organizations').addEventListener('change', (e) => {
                this.settings.filterOrganizations = e.target.checked;
                this.saveSettings();
            });
            
            document.getElementById('hh-delay').addEventListener('change', (e) => {
                this.settings.delay = parseFloat(e.target.value) || 0.5;
                this.saveSettings();
            });
            
            document.getElementById('hh-filter-text').addEventListener('input', (e) => {
                const text = e.target.value;
                this.filteredOrganizations = text.split(',')
                    .map(org => org.trim())
                    .filter(org => org.length > 0);
                this.saveSettings();
            });
            
            setInterval(() => this.updateCount(), 5000);
        }
        
        toggleTheme() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            this.saveSettings();
            this.updateStatus(`✅ Тема изменена на ${this.theme === 'dark' ? 'тёмную' : 'светлую'}`);
        }
        
        applyThemeWithoutReload() {
            const isDark = this.theme === 'dark';
            
            // Обновляем ползунок темы
            const handle = document.getElementById('hh-theme-slider-handle');
            const moonIcon = document.getElementById('hh-moon-icon');
            const sunIcon = document.getElementById('hh-sun-icon');
            const slider = document.getElementById('hh-theme-slider');
            
            if (handle) {
                handle.style.transform = isDark ? 'translateX(22px)' : 'translateX(2px)';
                handle.style.background = isDark ? '#4CAF50' : '#FF9800';
            }
            
            if (moonIcon) moonIcon.style.color = isDark ? '#4CAF50' : '#666';
            if (sunIcon) sunIcon.style.color = isDark ? '#aaa' : '#FF9800';
            if (slider) slider.style.background = isDark ? '#2d2d2d' : '#e0e0e0';
            
            // Обновляем цвета панели
            const bgColor = isDark ? '#1e1e1e' : 'white';
            const textColor = isDark ? '#ffffff' : '#333333';
            const borderColor = isDark ? '#444444' : '#4CAF50';
            const statusBg = isDark ? '#2d2d2d' : '#f0f8ff';
            const statusColor = isDark ? '#ffffff' : '#333333';
            const secondaryText = isDark ? '#aaaaaa' : '#666666';
            const inputBg = isDark ? '#2d2d2d' : 'white';
            const inputBorder = isDark ? '#555555' : '#dddddd';
            
            // Обновляем панель
            this.panel.style.background = bgColor;
            this.panel.style.color = textColor;
            this.panel.style.borderColor = borderColor;
            
            // Обновляем статус
            const statusEl = document.getElementById('hh-status');
            if (statusEl) {
                statusEl.style.background = statusBg;
                statusEl.style.color = statusColor;
                statusEl.style.borderColor = inputBorder;
            }
            
            // Обновляем статистику
            const statsEl = document.getElementById('hh-stats');
            if (statsEl) {
                statsEl.style.background = isDark ? '#2d2d2d' : '#f5f5f5';
                statsEl.style.borderColor = inputBorder;
            }
            
            // Обновляем инпуты
            const textarea = document.getElementById('hh-letter');
            const delayInput = document.getElementById('hh-delay');
            const filterTextarea = document.getElementById('hh-filter-text');
            
            if (textarea) {
                textarea.style.background = inputBg;
                textarea.style.color = textColor;
                textarea.style.borderColor = inputBorder;
            }
            
            if (delayInput) {
                delayInput.style.background = inputBg;
                delayInput.style.color = textColor;
                delayInput.style.borderColor = inputBorder;
            }
            
            if (filterTextarea) {
                filterTextarea.style.background = inputBg;
                filterTextarea.style.color = textColor;
                filterTextarea.style.borderColor = inputBorder;
            }
            
            // Обновляем счетчики и текст
            const countEl = document.getElementById('hh-count');
            if (countEl) countEl.style.color = textColor;
            
            // Обновляем все текстовые элементы
            const labels = this.panel.querySelectorAll('label, div, span:not(#hh-char-count)');
            labels.forEach(el => {
                // Пропускаем кнопки и их элементы
                if (el.closest('button') || el.id?.startsWith('hh-')) {
                    return;
                }
                if (el.style.color && !el.style.color.includes('white') && !el.style.color.includes('#2196F3')) {
                    el.style.color = textColor;
                }
            });
            
            // Обновляем вторичный текст
            const secondaryElements = this.panel.querySelectorAll('span[style*="color: #"], span[style*="color:#"]');
            secondaryElements.forEach(el => {
                if (el.style.color.includes('#666') || el.style.color.includes('#aaa')) {
                    el.style.color = secondaryText;
                }
            });
            
            // Обновляем кнопку переключения
            const btnBg = isDark ? 'linear-gradient(135deg, #333, #555)' : 'linear-gradient(135deg, #2196F3, #1976D2)';
            this.toggleButton.style.background = btnBg;
        }
        
        // ===== АВТО-ФИЛЬТР ОРГАНИЗАЦИЙ =====
        
        getOrganizationName(button) {
            const vacancyItem = button.closest('.vacancy-serp-item') || 
                               button.closest('.serp-item') ||
                               button.closest('[data-qa="vacancy-serp__vacancy"]');
            
            if (!vacancyItem) {
                return null;
            }
            
            let orgElement = vacancyItem.querySelector('[data-qa="vacancy-serp__vacancy-employer-text"]');
            
            if (orgElement) {
                const text = orgElement.textContent || orgElement.innerText || '';
                const trimmedText = text.trim();
                if (trimmedText) {
                    return trimmedText;
                }
            }
            
            const magritteTextElements = vacancyItem.querySelectorAll('.magritte-text');
            for (const element of magritteTextElements) {
                const text = element.textContent || element.innerText || '';
                const trimmedText = text.trim();
                if (trimmedText && !trimmedText.includes('$') && !trimmedText.includes('₽') && 
                    trimmedText.length > 1 && trimmedText.length < 100 && 
                    !trimmedText.includes('отклик') && !trimmedText.includes('просмотр')) {
                    return trimmedText;
                }
            }
            
            const links = vacancyItem.querySelectorAll('a');
            for (const link of links) {
                const text = link.textContent || link.innerText || '';
                const trimmedText = text.trim();
                if (trimmedText && trimmedText.length > 1 && trimmedText.length < 80 && 
                    !trimmedText.includes('отклик') && !trimmedText.includes('просмотр')) {
                    return trimmedText;
                }
            }
            
            return null;
        }
        
        isFilteredOrganization(button) {
            if (!this.settings.filterOrganizations) {
                return false;
            }
            
            const organizationName = this.getOrganizationName(button);
            if (!organizationName) {
                return false;
            }
            
            const orgNameLower = organizationName.toLowerCase().trim();
            
            for (const filter of this.filteredOrganizations) {
                if (!filter || !filter.trim()) continue;
                
                const filterLower = filter.toLowerCase().trim();
                
                if (orgNameLower.includes(filterLower) || filterLower.includes(orgNameLower)) {
                    return true;
                }
            }
            
            if (this.settings.autoRememberOrganizations) {
                for (const autoFilter of this.autoFilteredOrganizations) {
                    if (!autoFilter || !autoFilter.trim()) continue;
                    
                    const autoFilterLower = autoFilter.toLowerCase().trim();
                    
                    if (orgNameLower.includes(autoFilterLower) || autoFilterLower.includes(orgNameLower)) {
                        return true;
                    }
                }
            }
            
            return false;
        }
        
        addToAutoFilter(organizationName) {
            if (!organizationName) return false;
            
            const orgNameTrimmed = organizationName.trim();
            if (!orgNameTrimmed) return false;
            
            const orgNameLower = orgNameTrimmed.toLowerCase();
            const alreadyExists = this.autoFilteredOrganizations.some(org => 
                org.toLowerCase() === orgNameLower
            );
            
            if (alreadyExists) {
                return false;
            }
            
            this.autoFilteredOrganizations.push(orgNameTrimmed);
            this.saveSettings();
            
            return true;
        }
        
        showAutoFilter() {
            if (this.autoFilteredOrganizations.length === 0) {
                this.updateStatus('Автофильтр пуст. Организации будут добавляться автоматически при отправке откликов.');
                return;
            }
            
            let message = `АВТОФИЛЬТР (всего: ${this.autoFilteredOrganizations.length}):\n\n`;
            
            this.autoFilteredOrganizations.forEach((org, index) => {
                message += `${index + 1}. ${org}\n`;
            });
            
            message += `\n⚠️ Эти организации будут автоматически пропускаться в будущем.`;
            message += `\n\nИспользуйте кнопку "Очистить авто" для очистки.`;
            
            this.updateStatus(message);
        }
        
        clearAutoFilter() {
            if (this.autoFilteredOrganizations.length === 0) {
                this.updateStatus('Автофильтр уже пуст');
                return;
            }
            
            if (confirm(`Очистить автофильтр?\n\nУдалить ${this.autoFilteredOrganizations.length} организаций?\n\n✅ Успешные отклики: ${this.autoFilteredOrganizations.length}\n🚫 Больше не будут пропускаться автоматически`)) {
                const count = this.autoFilteredOrganizations.length;
                this.autoFilteredOrganizations = [];
                this.saveSettings();
                this.updateStatus(`🗑️ Автофильтр очищен (удалено ${count} организаций)`);
            }
        }
        
        // ===== УНИВЕРСАЛЬНАЯ ОБРАБОТКА ОТКЛИКОВ =====
        
        async universalProcess() {
            console.log('Универсальная обработка отклика...');
            
            // Уменьшено время ожидания
            await this.wait(800);
            
            const addLetterButton = document.querySelector('[data-qa="add-cover-letter"]');
            
            if (addLetterButton) {
                console.log('Найдена кнопка "Добавить сопроводительное" - у пользователя 2+ резюме');
                return await this.processWithCoverLetter();
            } else {
                console.log('Кнопка "Добавить сопроводительное" не найдена - у пользователя 1 резюме или прямая отправка');
                return await this.processDirectOrSimple();
            }
        }
        
        async processWithCoverLetter() {
            console.log('Обработка с сопроводительным письмом...');
            this.updateStatus('📝 Добавляем письмо...');
            
            try {
                const addLetterButton = document.querySelector('[data-qa="add-cover-letter"]');
                if (!addLetterButton) {
                    console.log('Кнопка не найдена');
                    return false;
                }
                
                console.log('Кликаем на кнопку...');
                addLetterButton.click();
                await this.wait(600);
                
                const textarea = document.querySelector('[data-qa="vacancy-response-popup-form-letter-input"]');
                if (!textarea) {
                    console.log('Поле для письма не найдено');
                    return false;
                }
                
                console.log('Заполняем поле...');
                
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 
                    'value'
                )?.set;
                
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(textarea, this.coverLetter);
                    
                    // Упрощенная обработка событий
                    const inputEvent = new Event('input', { bubbles: true });
                    textarea.dispatchEvent(inputEvent);
                    
                    await this.wait(150);
                } else {
                    textarea.value = this.coverLetter;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.wait(150);
                }
                
                return await this.submitResponse();
                
            } catch (e) {
                console.log('Ошибка при обработке с письмом:', e);
                return false;
            }
        }
        
        async processDirectOrSimple() {
            console.log('Обработка прямого/простого отклика...');
            this.updateStatus('📤 Отправляем отклик...');
            
            try {
                const submitButton = document.querySelector('[data-qa="vacancy-response-submit-popup"]');
                if (submitButton) {
                    console.log('Найдена кнопка отправки в модалке');
                    submitButton.click();
                    await this.wait(1000);
                    return true;
                } else {
                    console.log('Кнопка отправки не найдена - вероятно прямой отклик');
                    await this.wait(800);
                    return true;
                }
            } catch (e) {
                console.log('Ошибка при прямом отклике:', e);
                return false;
            }
        }
        
        async submitResponse() {
            console.log('Отправка отклика...');
            this.updateStatus('📤 Отправляем...');
            
            try {
                const submitButton = document.querySelector('[data-qa="vacancy-response-submit-popup"]');
                if (!submitButton) {
                    console.log('Кнопка отправки не найдена');
                    return false;
                }
                
                submitButton.click();
                await this.wait(1200);
                
                const success = await this.checkSuccess();
                return success;
                
            } catch (e) {
                console.log('Ошибка отправки:', e);
                return false;
            }
        }
        
        async checkSuccess() {
            await this.wait(800);
            
            // Быстрая проверка успешной отправки
            if (!document.querySelector('[data-qa="vacancy-response-popup"]')) {
                console.log('Отклик успешно отправлен');
                return true;
            }
            
            const bodyText = document.body.textContent || '';
            if (bodyText.includes('отклик отправлен') || 
                bodyText.includes('успешно отправлен')) {
                console.log('Отклик успешно отправлен');
                return true;
            }
            
            console.log('Предполагаем успешную отправку');
            return true;
        }
        
        updateStatus(message) {
            const statusEl = document.getElementById('hh-status');
            if (statusEl) {
                statusEl.textContent = message;
            }
            console.log('Статус:', message);
        }
        
        updateStatsDisplay() {
            const statsEl = document.getElementById('hh-stats');
            if (statsEl) {
                statsEl.textContent = `✅${this.stats.success} ❌${this.stats.failed} ⏭️${this.stats.skipped}`;
            }
            this.saveSettings();
        }
        
        updateCount() {
            const countEl = document.getElementById('hh-count');
            if (countEl) {
                const buttons = this.getAvailableButtons();
                countEl.textContent = buttons.length;
            }
        }
        
        updateControlButtons() {
            const startBtn = document.getElementById('hh-start');
            const testBtn = document.getElementById('hh-test');
            const stopBtn = document.getElementById('hh-stop');
            
            if (this.isRunning) {
                startBtn.style.display = 'none';
                testBtn.style.display = 'none';
                stopBtn.style.display = 'block';
                this.toggleButton.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                this.toggleButton.textContent = '⏹️';
            } else {
                const isDark = this.theme === 'dark';
                startBtn.style.display = 'block';
                testBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                this.toggleButton.style.background = isDark 
                    ? 'linear-gradient(135deg, #333, #555)' 
                    : 'linear-gradient(135deg, #2196F3, #1976D2)';
                this.toggleButton.textContent = '🚀';
            }
        }
        
        getAvailableButtons() {
            const allButtons = Array.from(document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]'));
            
            return allButtons.filter(button => {
                if (button.offsetParent === null || button.style.display === 'none') {
                    return false;
                }
                
                if (this.isFilteredOrganization(button)) {
                    return false;
                }
                
                if (this.isAlreadyRespondedVacancy(button)) {
                    return false;
                }
                
                return true;
            });
        }
        
        isAlreadyRespondedVacancy(button) {
            if (!this.settings.skipResponded) return false;
            
            const parent = button.closest('.vacancy-serp-item') || 
                           button.closest('.serp-item') ||
                           button.closest('[data-qa="vacancy-serp__vacancy"]');
            
            if (!parent) return false;
            
            const respondedElement = parent.querySelector('[data-qa="vacancy-serp__vacancy_responded"]');
            if (respondedElement) return true;
            
            const parentText = parent.innerText || parent.textContent || '';
            if (parentText.includes('Вы откликнулись') || 
                parentText.includes('Вы уже откликнулись') ||
                parentText.includes('Отклик отправлен')) {
                return true;
            }
            
            const buttonText = button.innerText || button.textContent || '';
            return !buttonText.includes('Откликнуться') && buttonText.trim() !== '';
        }
        
        async safeClick(button) {
            try {
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.wait(300);
                button.click();
                await this.wait(300);
                return true;
            } catch (error) {
                return false;
            }
        }
        
        async processSingleVacancy(button, index, total) {
            if (!this.isRunning) return false;
            
            this.stats.total++;
            this.updateStatsDisplay();
            
            const orgName = this.getOrganizationName(button);
            
            this.updateStatus(`🎯 ${index + 1}/${total}: ${orgName || 'Обработка...'}`);
            
            const clicked = await this.safeClick(button);
            
            if (!clicked) {
                this.stats.failed++;
                this.updateStatsDisplay();
                this.updateStatus(`❌ ${index + 1}/${total}: не удалось нажать`);
                return false;
            }
            
            const success = await this.universalProcess();
            
            if (success) {
                if (orgName && this.settings.autoRememberOrganizations) {
                    const added = this.addToAutoFilter(orgName);
                    if (added) {
                        this.updateStatus(`✅ ${index + 1}/${total}: отправлено! "${orgName}" добавлена в автофильтр`);
                    } else {
                        this.updateStatus(`✅ ${index + 1}/${total}: отправлено!`);
                    }
                } else {
                    this.updateStatus(`✅ ${index + 1}/${total}: отправлено!`);
                }
                
                this.stats.success++;
                this.updateStatsDisplay();
                return true;
            } else {
                this.stats.failed++;
                this.updateStatsDisplay();
                this.updateStatus(`⚠️ ${index + 1}/${total}: не удалось`);
                return false;
            }
        }
        
        async startAutoProcess() {
            if (this.isRunning) {
                this.updateStatus('⚠️ Процесс уже запущен');
                return;
            }
            
            this.isRunning = true;
            this.updateControlButtons();
            this.updateStatus('🚀 Запуск...');
            
            try {
                while (this.isRunning) {
                    const buttons = this.getAvailableButtons();
                    
                    if (buttons.length === 0) {
                        this.updateStatus('✅ Все доступные вакансии обработаны');
                        
                        if (this.settings.autoNextPage) {
                            const nextBtn = document.querySelector('[data-qa="pager-next"]');
                            if (nextBtn) {
                                this.updateStatus('➡️ Переход на след. страницу...');
                                nextBtn.click();
                                await this.wait(2000);
                                continue;
                            }
                        }
                        
                        this.updateStatus(`🎉 Завершено! Успешно: ${this.stats.success}, Ошибок: ${this.stats.failed}`);
                        break;
                    }
                    
                    this.updateStatus(`📊 Обработка ${buttons.length} вакансий...`);
                    
                    for (let i = 0; i < buttons.length; i++) {
                        if (!this.isRunning) break;
                        
                        await this.processSingleVacancy(buttons[i], i, buttons.length);
                        
                        if (i < buttons.length - 1) {
                            await this.wait(this.settings.delay * 1000);
                        }
                    }
                    
                    await this.wait(800);
                }
            } catch (error) {
                console.error('Ошибка процесса:', error);
                this.updateStatus('❌ Ошибка');
            } finally {
                this.stopAutoProcess();
            }
        }
        
        stopAutoProcess() {
            this.isRunning = false;
            this.updateControlButtons();
            this.updateStatus('⏹️ Остановлено');
        }
        
        async testProcess() {
            const buttons = this.getAvailableButtons();
            if (buttons.length === 0) {
                this.updateStatus('❌ Нет вакансий для теста');
                return;
            }
            
            this.updateStatus('🧪 Тестируем...');
            this.isRunning = true;
            const success = await this.processSingleVacancy(buttons[0], 0, 1);
            this.isRunning = false;
            this.updateControlButtons();
            
            this.updateStatus(success ? '✅ Тест успешен!' : '⚠️ Тест не удался');
        }
        
        testFilter() {
            const buttons = document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]');
            let result = '🔍 Тест фильтра:\n\n';
            
            buttons.forEach((btn, i) => {
                const org = this.getOrganizationName(btn);
                const filtered = this.isFilteredOrganization(btn);
                result += `${i + 1}. ${org || '???'} - ${filtered ? '🚫 ФИЛЬТР' : '✅ НОРМА'}\n`;
            });
            
            this.updateStatus(result);
        }
        
        analyzePage() {
            const all = document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]').length;
            const available = this.getAvailableButtons().length;
            
            this.updateStatus(`📊 Анализ:\nВсего: ${all}\nДоступно: ${available}\nУспешно: ${this.stats.success}\nОшибок: ${this.stats.failed}`);
        }
        
        clearHistory() {
            this.processedVacancies.clear();
            this.stats = { success: 0, failed: 0, skipped: 0, total: 0 };
            this.updateStatsDisplay();
            this.updateStatus('🗑️ История очищена');
        }
    }
    
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => new HHAutoResponder(), 800);
            });
        } else {
            setTimeout(() => new HHAutoResponder(), 800);
        }
    }
    
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'checkConnection') {
            sendResponse({ 
                connected: window.hhAutoResponder !== undefined 
            });
        }
        return true;
    });
    
    initialize();
    

})();
