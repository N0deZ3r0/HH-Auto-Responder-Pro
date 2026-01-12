// ===== HH АВТО-ОТКЛИК - ФИНАЛЬНАЯ ВЕРСИЯ =====
(function() {
    'use strict';
    
    console.log('=== HH Авто-отклик v1.0 ===');
    
    // Проверяем, что мы на HH.ru
    if (!window.location.href.includes('hh.ru')) {
        console.log('⚠️ Не страница HH.ru, скрипт не активирован');
        return;
    }
    
    // Основной класс для управления авто-откликом
    class HHAutoResponder {
        constructor() {
            this.coverLetter = `Добрый день!\n\nЗаинтересовала ваша вакансия. Мой опыт соответствует требованиям. Готов(а) к собеседованию.\n\nС уважением,\n[Ваше Имя]`;
            this.isRunning = false;
            this.processedVacancies = new Set();
            this.stats = { success: 0, failed: 0, skipped: 0, total: 0 };
            this.settings = { autoNextPage: true, skipResponded: true, delay: 1 };
            this.theme = 'dark'; // Темная тема по умолчанию
            
            // Сохраняем инстанс в глобальной области
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
                    theme: this.theme
                }));
            } catch (e) {
                console.log('Не удалось сохранить настройки');
            }
        }
        
        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // ===== ИНТЕРФЕЙС =====
        
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
            
            // Применяем стили в зависимости от темы
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
                width: '300px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                fontFamily: 'Arial, sans-serif',
                maxHeight: '80vh',
                overflowY: 'auto',
                transition: 'all 0.3s'
            });
            
            this.createPanelContent(isDark, bgColor, textColor, borderColor, statusBg, statusColor, secondaryText, inputBg, inputBorder);
            document.body.appendChild(this.panel);
        }
        
        createPanelContent(isDark, bgColor, textColor, borderColor, statusBg, statusColor, secondaryText, inputBg, inputBorder) {
            const sliderPosition = isDark ? 'translateX(22px)' : 'translateX(2px)';
            const moonColor = isDark ? '#4CAF50' : secondaryText;
            const sunColor = isDark ? secondaryText : '#FF9800';
            
            this.panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: #2196F3; font-size: 20px;"></span>
                        <h3 style="margin: 0; color: #2196F3; font-size: 16px;">HH Авто-отклик</h3>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span id="hh-moon-icon" style="font-size: 14px; color: ${moonColor}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">🌙</span>
                            <div id="hh-theme-slider" style="position: relative; width: 44px; height: 20px; cursor: pointer; border-radius: 12px; background: ${isDark ? 'linear-gradient(90deg, #2d2d2d 0%, #3d3d3d 100%)' : 'linear-gradient(90deg, #e0e0e0 0%, #cccccc 100%)'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);">
                                <div id="hh-theme-slider-track" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 6px;">
                                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isDark ? '#4CAF50' : '#888'}; opacity: ${isDark ? '1' : '0.3'}; transition: all 0.3s;"></div>
                                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isDark ? '#888' : '#FF9800'}; opacity: ${isDark ? '0.3' : '1'}; transition: all 0.3s;"></div>
                                </div>
                                <div id="hh-theme-slider-handle" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: ${isDark ? 'radial-gradient(circle at 30% 30%, #66BB6A, #4CAF50)' : 'radial-gradient(circle at 30% 30%, #FFD54F, #FF9800)'}; border-radius: 50%; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); transform: ${sliderPosition}; box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset; animation: glow 2s infinite alternate;">
                                    <div style="position: absolute; top: 4px; left: 4px; width: 4px; height: 4px; background: rgba(255,255,255,0.8); border-radius: 50%;"></div>
                                </div>
                            </div>
                            <span id="hh-sun-icon" style="font-size: 14px; color: ${sunColor}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">☀️</span>
                        </div>
                        <button id="hh-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: ${secondaryText}; padding: 2px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;" title="Скрыть панель">
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; color: ${textColor};">
                        <span style="font-size: 13px;">Задержка (сек):</span>
                        <input type="number" id="hh-delay" min="0.5" max="10" step="0.5" value="${this.settings.delay}" style="width: 50px; padding: 4px; border: 1px solid ${inputBorder}; border-radius: 4px; background: ${inputBg}; color: ${textColor}; text-align: center;">
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px; margin: 15px 0 10px 0;">
                    <button id="hh-start" style="padding: 12px; background: linear-gradient(135deg, #4CAF50, #45a049); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.3s;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>▶️</span>
                            НАЧАТЬ АВТО-ОТКЛИК
                        </span>
                    </button>
                    <button id="hh-test" style="padding: 10px; background: linear-gradient(135deg, #FF9800, #f57c00); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.3s;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>🧪</span>
                            Тест на 1 вакансию
                        </span>
                    </button>
                    <button id="hh-stop" style="padding: 12px; background: linear-gradient(135deg, #f44336, #d32f2f); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: none; transition: all 0.3s;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>⏹️</span>
                            ОСТАНОВИТЬ
                        </span>
                    </button>
                </div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button id="hh-analyze" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #2196F3, #1976D2); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.3s;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>📊</span>
                            Анализ
                        </span>
                    </button>
                    <button id="hh-clear" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #607D8B, #455a64); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.3s;">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <span>🗑️</span>
                            Очистить
                        </span>
                    </button>
                </div>
                
                <div style="margin-top: 15px; font-size: 11px; color: ${secondaryText}; text-align: center; border-top: 1px solid ${inputBorder}; padding-top: 10px;">
                    by alex
                </div>
            `;
            
            // Добавляем CSS анимацию для ползунка
            this.addSliderAnimation();
        }
        
        addSliderAnimation() {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes glow {
                    0% { box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 0 5px rgba(76, 175, 80, 0.3); }
                    100% { box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 0 10px rgba(76, 175, 80, 0.6); }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @keyframes pulse {
                    0% { opacity: 0.3; }
                    50% { opacity: 1; }
                    100% { opacity: 0.3; }
                }
                
                @keyframes slide-in {
                    0% { transform: translateX(0) scale(0.8); opacity: 0; }
                    100% { transform: translateX(22px) scale(1); opacity: 1; }
                }
                
                @keyframes slide-out {
                    0% { transform: translateX(22px) scale(0.8); opacity: 0; }
                    100% { transform: translateX(2px) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        createToggleButton() {
            this.toggleButton = document.createElement('button');
            this.toggleButton.id = 'hh-toggle-btn';
            this.toggleButton.innerHTML = '🚀';
            
            // Применяем стиль в зависимости от темы
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
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            });
            
            document.body.appendChild(this.toggleButton);
        }
        
        setupEventListeners() {
            // Переключение панели
            this.toggleButton.addEventListener('click', () => {
                this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
            });
            
            // Закрытие панели
            document.getElementById('hh-close-btn').addEventListener('click', () => {
                this.panel.style.display = 'none';
            });
            
            // Переключение темы через слайдер с анимацией
            const themeSlider = document.getElementById('hh-theme-slider');
            if (themeSlider) {
                themeSlider.addEventListener('click', () => this.toggleThemeWithAnimation());
            }
            
            // Основные кнопки
            document.getElementById('hh-start').addEventListener('click', () => this.startAutoProcess());
            document.getElementById('hh-test').addEventListener('click', () => this.testProcess());
            document.getElementById('hh-stop').addEventListener('click', () => this.stopAutoProcess());
            document.getElementById('hh-analyze').addEventListener('click', () => this.analyzePage());
            document.getElementById('hh-clear').addEventListener('click', () => this.clearHistory());
            
            // Настройки
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
            
            document.getElementById('hh-delay').addEventListener('change', (e) => {
                this.settings.delay = parseFloat(e.target.value) || 1;
                this.saveSettings();
            });
            
            // Ховер эффекты
            this.addHoverEffects();
            
            // Обновление счетчиков
            setInterval(() => this.updateCount(), 5000);
        }
        
        toggleThemeWithAnimation() {
            const handle = document.getElementById('hh-theme-slider-handle');
            const moonIcon = document.getElementById('hh-moon-icon');
            const sunIcon = document.getElementById('hh-sun-icon');
            const slider = document.getElementById('hh-theme-slider');
            const trackDots = slider.querySelectorAll('#hh-theme-slider-track > div');
            
            // Анимация переключения
            if (this.theme === 'dark') {
                // Темная → Светлая
                handle.style.animation = 'slide-out 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                moonIcon.style.color = '#666';
                sunIcon.style.color = '#FF9800';
                moonIcon.style.transform = 'scale(0.9)';
                sunIcon.style.transform = 'scale(1.1)';
                
                // Анимация точек на треке
                if (trackDots[0]) trackDots[0].style.opacity = '0.3';
                if (trackDots[1]) trackDots[1].style.opacity = '1';
                
                // Изменение цвета ползунка с анимацией
                handle.style.background = 'radial-gradient(circle at 30% 30%, #FFD54F, #FF9800)';
                slider.style.background = 'linear-gradient(90deg, #e0e0e0 0%, #cccccc 100%)';
                
                setTimeout(() => {
                    this.theme = 'light';
                    this.saveSettings();
                    this.updateStatus('✅ Тема изменена на светлую');
                }, 200);
                
            } else {
                // Светлая → Темная
                handle.style.animation = 'slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';
                moonIcon.style.color = '#4CAF50';
                sunIcon.style.color = '#aaa';
                moonIcon.style.transform = 'scale(1.1)';
                sunIcon.style.transform = 'scale(0.9)';
                
                // Анимация точек на треке
                if (trackDots[0]) trackDots[0].style.opacity = '1';
                if (trackDots[1]) trackDots[1].style.opacity = '0.3';
                
                // Изменение цвета ползунка с анимацией
                handle.style.background = 'radial-gradient(circle at 30% 30%, #66BB6A, #4CAF50)';
                slider.style.background = 'linear-gradient(90deg, #2d2d2d 0%, #3d3d3d 100%)';
                
                setTimeout(() => {
                    this.theme = 'dark';
                    this.saveSettings();
                    this.updateStatus('✅ Тема изменена на темную');
                }, 200);
            }
            
            // Обновляем остальной интерфейс после анимации
            setTimeout(() => {
                this.updateInterfaceAfterThemeChange();
            }, 400);
        }
        
        updateInterfaceAfterThemeChange() {
            const isDark = this.theme === 'dark';
            
            // Обновляем кнопку переключения
            const btnBg = isDark ? 'linear-gradient(135deg, #333, #555)' : 'linear-gradient(135deg, #2196F3, #1976D2)';
            this.toggleButton.style.background = btnBg;
            
            // Обновляем панель
            const bgColor = isDark ? '#1e1e1e' : 'white';
            const textColor = isDark ? '#ffffff' : '#333333';
            const borderColor = isDark ? '#444444' : '#4CAF50';
            const statusBg = isDark ? '#2d2d2d' : '#f0f8ff';
            const statusColor = isDark ? '#ffffff' : '#333333';
            const secondaryText = isDark ? '#aaaaaa' : '#666666';
            const inputBg = isDark ? '#2d2d2d' : 'white';
            const inputBorder = isDark ? '#555555' : '#dddddd';
            
            // Плавное изменение цветов панели
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
            const checkboxes = document.querySelectorAll('#hh-auto-next, #hh-skip-responded');
            
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
            
            // Обновляем текст
            const textElements = this.panel.querySelectorAll('div, span, label');
            textElements.forEach(el => {
                if (!el.id || !el.id.startsWith('hh-')) {
                    el.style.color = textColor;
                }
            });
            
            // Обновляем вторичный текст
            const secondaryElements = this.panel.querySelectorAll('.secondary-text');
            secondaryElements.forEach(el => {
                el.style.color = secondaryText;
            });
        }
        
        toggleTheme() {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            this.saveSettings();
            
            // Обновляем интерфейс с новой темой
            this.createInterface();
            this.setupEventListeners();
            
            this.updateStatus(`✅ Тема изменена на ${this.theme === 'dark' ? 'темную' : 'светлую'}`);
        }
        
        addHoverEffects() {
            const buttons = [
                { id: 'hh-start', normal: 'linear-gradient(135deg, #4CAF50, #45a049)', hover: 'linear-gradient(135deg, #45a049, #388E3C)' },
                { id: 'hh-test', normal: 'linear-gradient(135deg, #FF9800, #f57c00)', hover: 'linear-gradient(135deg, #f57c00, #EF6C00)' },
                { id: 'hh-stop', normal: 'linear-gradient(135deg, #f44336, #d32f2f)', hover: 'linear-gradient(135deg, #d32f2f, #C62828)' },
                { id: 'hh-analyze', normal: 'linear-gradient(135deg, #2196F3, #1976D2)', hover: 'linear-gradient(135deg, #1976D2, #1565C0)' },
                { id: 'hh-clear', normal: 'linear-gradient(135deg, #607D8B, #455a64)', hover: 'linear-gradient(135deg, #455a64, #37474F)' }
            ];
            
            buttons.forEach(btn => {
                const element = document.getElementById(btn.id);
                if (element) {
                    element.addEventListener('mouseenter', () => {
                        element.style.background = btn.hover;
                        element.style.transform = 'translateY(-2px)';
                        element.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                    });
                    
                    element.addEventListener('mouseleave', () => {
                        element.style.background = btn.normal;
                        element.style.transform = 'translateY(0)';
                        element.style.boxShadow = 'none';
                    });
                }
            });
            
            // Ховер для кнопки переключения
            this.toggleButton.addEventListener('mouseenter', () => {
                const isDark = this.theme === 'dark';
                this.toggleButton.style.background = isDark 
                    ? 'linear-gradient(135deg, #444, #666)' 
                    : 'linear-gradient(135deg, #1976D2, #1565C0)';
                this.toggleButton.style.transform = 'scale(1.1)';
                this.toggleButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
            });
            
            this.toggleButton.addEventListener('mouseleave', () => {
                const isDark = this.theme === 'dark';
                this.toggleButton.style.background = isDark 
                    ? 'linear-gradient(135deg, #333, #555)' 
                    : 'linear-gradient(135deg, #2196F3, #1976D2)';
                this.toggleButton.style.transform = 'scale(1)';
                this.toggleButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            
            // Ховер для слайдера темы с анимацией
            const themeSlider = document.getElementById('hh-theme-slider');
            const closeBtn = document.getElementById('hh-close-btn');
            
            if (themeSlider) {
                themeSlider.addEventListener('mouseenter', () => {
                    const isDark = this.theme === 'dark';
                    themeSlider.style.transform = 'scale(1.05)';
                    themeSlider.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.1)';
                    
                    // Усиливаем анимацию свечения
                    const handle = document.getElementById('hh-theme-slider-handle');
                    if (handle) {
                        handle.style.animation = 'glow 1s infinite alternate, bounce 2s infinite';
                        handle.style.transform += ' scale(1.05)';
                    }
                });
                
                themeSlider.addEventListener('mouseleave', () => {
                    const isDark = this.theme === 'dark';
                    themeSlider.style.transform = 'scale(1)';
                    themeSlider.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.2)';
                    
                    // Возвращаем обычную анимацию
                    const handle = document.getElementById('hh-theme-slider-handle');
                    if (handle) {
                        handle.style.animation = 'glow 2s infinite alternate';
                        handle.style.transform = handle.style.transform.replace(' scale(1.05)', '');
                    }
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.background = this.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                    closeBtn.style.transform = 'scale(1.1)';
                    closeBtn.style.animation = 'pulse 1s infinite';
                });
                
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.background = 'none';
                    closeBtn.style.transform = 'scale(1)';
                    closeBtn.style.animation = 'none';
                });
            }
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
        
        // ===== ОСНОВНАЯ ЛОГИКА =====
        
        getVacancyId(button) {
            const vacancyItem = button.closest('.vacancy-serp-item') || 
                               button.closest('.serp-item') ||
                               button.closest('[data-qa="vacancy-serp__vacancy"]');
            
            if (vacancyItem) {
                const link = vacancyItem.querySelector('a[href*="/vacancy/"]');
                if (link && link.href) {
                    return link.href.split('?')[0];
                }
            }
            
            return button.href || `vacancy-${Date.now()}`;
        }
        
        isAlreadyRespondedVacancy(button) {
            if (!this.settings.skipResponded) return false;
            
            const parent = button.closest('.vacancy-serp-item') || 
                           button.closest('.serp-item') ||
                           button.closest('[data-qa="vacancy-serp__vacancy"]');
            
            if (!parent) return false;
            
            // Проверяем по data-qa атрибуту
            const respondedElement = parent.querySelector('[data-qa="vacancy-serp__vacancy_responded"]');
            if (respondedElement) return true;
            
            // Проверяем текст
            const parentText = parent.innerText || parent.textContent || '';
            if (parentText.includes('Вы откликнулись') || 
                parentText.includes('Вы уже откликнулись') ||
                parentText.includes('Отклик отправлен')) {
                return true;
            }
            
            // Проверяем кнопку
            const buttonText = button.innerText || button.textContent || '';
            return !buttonText.includes('Откликнуться') && buttonText.trim() !== '';
        }
        
        getAvailableButtons() {
            const allButtons = Array.from(document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]'));
            
            return allButtons.filter(button => {
                if (button.offsetParent === null) return false;
                if (button.style.display === 'none') return false;
                return !this.isAlreadyRespondedVacancy(button);
            });
        }
        
        async safeClick(button) {
            try {
                // Прокручиваем к кнопке
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.wait(400);
                
                // Подсвечиваем
                const originalStyle = button.style.cssText;
                button.style.outline = '3px solid #4CAF50';
                button.style.outlineOffset = '2px';
                button.style.transition = 'outline 0.3s';
                
                await this.wait(150);
                
                // Пробуем разные методы клика
                try {
                    button.click();
                } catch (e) {
                    // Альтернативный метод
                    const rect = button.getBoundingClientRect();
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    });
                    button.dispatchEvent(event);
                }
                
                await this.wait(150);
                
                // Возвращаем стиль
                setTimeout(() => {
                    button.style.cssText = originalStyle;
                }, 500);
                
                return true;
            } catch (error) {
                console.error('Ошибка клика:', error);
                return false;
            }
        }
        
        // === МЕТОДЫ ДЛЯ REACT ПОЛЕЙ ===
        async fillCoverLetterField() {
            await this.wait(800);
            
            const textarea = document.querySelector('[data-qa="vacancy-response-popup-form-letter-input"]');
            if (!textarea) return false;
            
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(300);
            
            textarea.style.outline = '2px solid #4CAF50';
            textarea.style.outlineOffset = '2px';
            
            textarea.focus();
            await this.wait(200);
            textarea.select();
            await this.wait(100);
            
            // Устанавливаем значение
            try {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype, 
                    'value'
                ).set;
                nativeInputValueSetter.call(textarea, this.coverLetter);
                
                const reactInputEvent = new Event('input', { bubbles: true, cancelable: true });
                Object.defineProperty(reactInputEvent, 'target', { value: textarea });
                textarea.dispatchEvent(reactInputEvent);
                
                const changeEvent = new Event('change', { bubbles: true });
                textarea.dispatchEvent(changeEvent);
            } catch (e) {
                textarea.value = this.coverLetter;
                ['input', 'change', 'blur'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true });
                    Object.defineProperty(event, 'target', { value: textarea });
                    textarea.dispatchEvent(event);
                });
            }
            
            await this.wait(300);
            
            if (textarea.value && textarea.value.length > 10) {
                setTimeout(() => { textarea.style.outline = ''; }, 500);
                return true;
            }
            
            return false;
        }
        
        async clickAddCoverLetterButton() {
            const buttonSelectors = [
                '.magritte-button-view___53Slm_7-0-6',
                'span.magritte-button-view___53Slm_7-0-6',
                '[class*="magritte-button-view"]',
                '[class*="magritte-button__label"]'
            ];
            
            for (const selector of buttonSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element.textContent && element.textContent.includes('Добавить сопроводительное')) {
                        for (let attempt = 1; attempt <= 2; attempt++) {
                            try {
                                element.click();
                                await this.wait(500);
                                return true;
                            } catch (e) {
                                try {
                                    const parent = element.parentElement;
                                    if (parent) {
                                        parent.click();
                                        await this.wait(500);
                                        return true;
                                    }
                                } catch (e) {}
                            }
                            await this.wait(200);
                        }
                    }
                }
            }
            
            // Поиск по тексту
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                if (element.textContent && element.textContent.trim() === 'Добавить сопроводительное') {
                    try {
                        element.click();
                        await this.wait(500);
                        return true;
                    } catch (e) {
                        console.log('Не удалось кликнуть');
                    }
                }
            }
            
            return false;
        }
        
        async clickSubmitButton() {
            const submitSelectors = [
                '[data-qa="vacancy-response-submit-popup"]',
                'button[type="submit"]',
                '.vacancy-response-popup__submit'
            ];
            
            for (const selector of submitSelectors) {
                const button = document.querySelector(selector);
                if (button) {
                    try {
                        button.click();
                        return true;
                    } catch (e) {
                        console.log('Ошибка:', e);
                    }
                }
            }
            
            // Ищем по тексту
            const textButtons = ['Откликнуться', 'Отправить отклик'];
            const allButtons = document.querySelectorAll('button');
            
            for (const button of allButtons) {
                for (const text of textButtons) {
                    if (button.textContent && button.textContent.includes(text)) {
                        try {
                            button.click();
                            return true;
                        } catch (e) {
                            console.log('Ошибка:', e);
                        }
                    }
                }
            }
            
            return false;
        }
        
        async processModalWindow() {
            await this.wait(2000);
            
            try {
                this.updateStatus('📝 Нажимаем "Добавить сопроводительное"...');
                const letterButtonClicked = await this.clickAddCoverLetterButton();
                
                let letterFilled = false;
                if (letterButtonClicked) {
                    this.updateStatus('✍️ Заполняем письмо...');
                    letterFilled = await this.fillCoverLetterField();
                }
                
                if (!letterButtonClicked) {
                    this.updateStatus('✍️ Заполняем письмо...');
                    letterFilled = await this.fillCoverLetterField();
                }
                
                this.updateStatus('📤 Отправляем отклик...');
                const submitted = await this.clickSubmitButton();
                
                if (submitted) {
                    await this.wait(1000);
                    this.updateStatus('✅ Отклик отправлен!');
                    return true;
                }
                
            } catch (error) {
                console.log('Ошибка при обработке модалки:', error);
                this.updateStatus('❌ Ошибка при обработке');
            }
            
            return false;
        }
        
        async processSingleVacancy(button, index, total) {
            if (!this.isRunning) return false;
            
            this.stats.total++;
            this.updateStatsDisplay();
            
            const vacancyId = this.getVacancyId(button);
            
            if (this.processedVacancies.has(vacancyId)) {
                this.stats.skipped++;
                this.updateStatsDisplay();
                this.updateStatus(`⏭️ ${index + 1}/${total}: уже обработана`);
                return false;
            }
            
            if (this.isAlreadyRespondedVacancy(button)) {
                this.processedVacancies.add(vacancyId);
                this.stats.skipped++;
                this.updateStatsDisplay();
                this.updateStatus(`⏭️ ${index + 1}/${total}: уже откликались`);
                return false;
            }
            
            this.updateStatus(`🎯 ${index + 1}/${total}: обрабатываем...`);
            
            const clicked = await this.safeClick(button);
            
            if (!clicked) {
                this.processedVacancies.add(vacancyId);
                this.stats.failed++;
                this.updateStatsDisplay();
                this.updateStatus(`❌ ${index + 1}/${total}: не удалось нажать`);
                return false;
            }
            
            const success = await this.processModalWindow();
            
            if (success) {
                this.processedVacancies.add(vacancyId);
                this.stats.success++;
                this.updateStatsDisplay();
                this.updateStatus(`✅ ${index + 1}/${total}: отправлено!`);
                return true;
            } else {
                this.processedVacancies.add(vacancyId);
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
            
            console.log('🚀 Запуск авто-отклика...');
            this.isRunning = true;
            
            this.updateControlButtons();
            this.updateStatus('🚀 Запуск авто-отклика...');
            
            this.stats = { success: 0, failed: 0, skipped: 0, total: 0 };
            this.updateStatsDisplay();
            
            try {
                while (this.isRunning) {
                    const buttons = this.getAvailableButtons();
                    
                    if (buttons.length === 0) {
                        this.updateStatus('✅ Все доступные вакансии обработаны');
                        
                        if (this.settings.autoNextPage) {
                            const nextBtn = document.querySelector('[data-qa="pager-next"]:not([disabled])');
                            if (nextBtn && this.isRunning) {
                                this.updateStatus('➡️ Переход на следующую страницу...');
                                await this.wait(1500);
                                nextBtn.click();
                                await this.wait(3000);
                                continue;
                            }
                        }
                        
                        this.updateStatus(`🎉 Завершено! Успешно: ${this.stats.success}, Ошибок: ${this.stats.failed}`);
                        this.stopAutoProcess();
                        break;
                    }
                    
                    this.updateStatus(`📊 Обработка ${buttons.length} вакансий...`);
                    
                    for (let i = 0; i < buttons.length; i++) {
                        if (!this.isRunning) break;
                        
                        await this.processSingleVacancy(buttons[i], i, buttons.length);
                        
                        if (i < buttons.length - 1 && this.isRunning) {
                            this.updateStatus(`⏳ Пауза ${this.settings.delay} секунд...`);
                            await this.wait(this.settings.delay * 1000);
                        }
                    }
                    
                    if (this.isRunning) {
                        await this.wait(500);
                    }
                }
            } catch (error) {
                console.error('Ошибка основного процесса:', error);
                this.updateStatus('❌ Ошибка процесса');
            } finally {
                this.isRunning = false;
                this.updateControlButtons();
            }
        }
        
        stopAutoProcess() {
            console.log('⏹️ Остановка авто-отклика...');
            this.isRunning = false;
            this.updateControlButtons();
            this.updateStatus('⏹️ Процесс остановлен');
        }
        
        async testProcess() {
            if (this.isRunning) {
                this.updateStatus('⚠️ Сначала остановите текущий процесс');
                return;
            }
            
            this.updateStatus('🧪 Тестируем...');
            
            const buttons = this.getAvailableButtons();
            if (buttons.length === 0) {
                this.updateStatus('❌ Нет доступных вакансий для теста');
                return;
            }
            
            this.updateStatus('🎯 Нажимаем на первую вакансию...');
            
            this.isRunning = true;
            const success = await this.processSingleVacancy(buttons[0], 0, 1);
            this.isRunning = false;
            
            this.updateControlButtons();
            
            if (success) {
                this.updateStatus('✅ Тест успешен! Можно запускать авто-отклик.');
            } else {
                this.updateStatus('⚠️ Тест не удался. Проверьте консоль (F12).');
            }
        }
        
        analyzePage() {
            const buttons = this.getAvailableButtons();
            const allElements = document.querySelectorAll('[data-qa="vacancy-serp__vacancy_response"]');
            const responded = Array.from(allElements).filter(btn => this.isAlreadyRespondedVacancy(btn));
            
            const analysis = `📊 Анализ страницы:
• Всего вакансий: ${allElements.length}
• Уже откликнулись: ${responded.length}
• Доступно для отклика: ${buttons.length}
• Обработано в сессии: ${this.stats.total}`;
            
            this.updateStatus(analysis);
        }
        
        clearHistory() {
            if (confirm('Очистить историю обработанных вакансий?')) {
                this.processedVacancies.clear();
                this.stats = { success: 0, failed: 0, skipped: 0, total: 0 };
                this.updateStatsDisplay();
                this.updateStatus('🗑️ История очищена');
            }
        }
    }
    
    // Запускаем когда страница загружена
    function initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => new HHAutoResponder(), 1000);
            });
        } else {
            setTimeout(() => new HHAutoResponder(), 1000);
        }
    }
    
    // ===== ОБРАБОТЧИК СООБЩЕНИЙ ДЛЯ POPUP =====
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'checkConnection') {
            sendResponse({ 
                connected: window.hhAutoResponder !== undefined 
            });
        }
        return true;
    });
    
    // Запускаем инициализацию
    initialize();
    
})();