document.addEventListener('DOMContentLoaded', () => {
    // --- Data Binding for simple inputs ---
    const bindInput = (inputId, targetId, isList = false) => {
        const input = document.getElementById(inputId);
        const target = document.getElementById(targetId);
        
        if (!input || !target) return;

        input.addEventListener('input', (e) => {
            if (isList) {
                // Skills parsing
                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                target.innerHTML = skills.map(skill => `<span class="cv-skill-tag">${skill}</span>`).join('');
            } else {
                target.textContent = e.target.value;
            }
        });

        // Trigger initial render
        input.dispatchEvent(new Event('input'));
    };

    bindInput('nameInput', 'cvName');
    bindInput('titleInput', 'cvTitle');
    bindInput('emailInput', 'cvEmail');
    bindInput('phoneInput', 'cvPhone');
    bindInput('locationInput', 'cvLocation');
    bindInput('summaryInput', 'cvSummary');
    bindInput('skillsInput', 'cvSkillsList', true);


    // --- Dynamic Lists (Experience & Education) ---
    
    // State
    let experiences = [
        { id: 1, title: 'Desarrollador Web Senior', company: 'Tech Solutions Inc.', date: '2020 - Presente', desc: 'Lideré el desarrollo de múltiples aplicaciones frontend utilizando React. Mejoré el rendimiento en un 40%.' }
    ];
    
    let educations = [
        { id: 1, degree: 'Grado en Ingeniería Informática', school: 'Universidad Complutense de Madrid', date: '2015 - 2019', desc: 'Especialización en Ingeniería de Software.' }
    ];

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const renderList = (type) => {
        const isExp = type === 'experience';
        const data = isExp ? experiences : educations;
        const editorList = document.getElementById(isExp ? 'experienceList' : 'educationList');
        const cvList = document.getElementById(isExp ? 'cvExperienceList' : 'cvEducationList');
        
        editorList.innerHTML = '';
        cvList.innerHTML = '';

        data.forEach((item, index) => {
            // Editor Item
            const editorHTML = `
                <div class="dynamic-item" data-id="${item.id}">
                    <button class="remove-btn" onclick="removeItem('${type}', '${item.id}')"><i class="fa-solid fa-times"></i></button>
                    <div class="form-group">
                        <input type="text" class="item-title" placeholder="${isExp ? 'Puesto / Cargo' : 'Título / Grado'}" value="${isExp ? item.title : item.degree}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <input type="text" class="item-subtitle" placeholder="${isExp ? 'Empresa' : 'Institución'}" value="${isExp ? item.company : item.school}">
                        </div>
                        <div class="form-group">
                            <input type="text" class="item-date" placeholder="Fecha (Ej. 2020 - 2023)" value="${item.date}">
                        </div>
                    </div>
                    <div class="form-group mb-0">
                        <textarea class="item-desc" rows="2" placeholder="Descripción...">${item.desc}</textarea>
                    </div>
                </div>
            `;
            editorList.insertAdjacentHTML('beforeend', editorHTML);

            // CV Preview Item
            const cvHTML = `
                <div class="cv-item">
                    <div class="cv-item-header">
                        <div class="cv-item-title">${isExp ? item.title : item.degree}</div>
                        <div class="cv-item-date">${item.date}</div>
                    </div>
                    <div class="cv-item-subtitle">${isExp ? item.company : item.school}</div>
                    <div class="cv-item-desc">${item.desc}</div>
                </div>
            `;
            cvList.insertAdjacentHTML('beforeend', cvHTML);
        });

        // Add event listeners to newly created inputs
        Array.from(editorList.children).forEach((node) => {
            const id = node.getAttribute('data-id');
            const inputs = node.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    const targetArr = isExp ? experiences : educations;
                    const index = targetArr.findIndex(i => i.id == id);
                    if(index !== -1) {
                        if (e.target.classList.contains('item-title')) {
                            if(isExp) targetArr[index].title = e.target.value;
                            else targetArr[index].degree = e.target.value;
                        }
                        if (e.target.classList.contains('item-subtitle')) {
                            if(isExp) targetArr[index].company = e.target.value;
                            else targetArr[index].school = e.target.value;
                        }
                        if (e.target.classList.contains('item-date')) targetArr[index].date = e.target.value;
                        if (e.target.classList.contains('item-desc')) targetArr[index].desc = e.target.value;
                        
                        // Re-render only the CV side to avoid losing focus on input
                        renderCVOnly(type);
                    }
                });
            });
        });
    };

    const renderCVOnly = (type) => {
        const isExp = type === 'experience';
        const data = isExp ? experiences : educations;
        const cvList = document.getElementById(isExp ? 'cvExperienceList' : 'cvEducationList');
        cvList.innerHTML = '';
        
        data.forEach(item => {
            const cvHTML = `
                <div class="cv-item">
                    <div class="cv-item-header">
                        <div class="cv-item-title">${isExp ? item.title : item.degree}</div>
                        <div class="cv-item-date">${item.date}</div>
                    </div>
                    <div class="cv-item-subtitle">${isExp ? item.company : item.school}</div>
                    <div class="cv-item-desc">${item.desc}</div>
                </div>
            `;
            cvList.insertAdjacentHTML('beforeend', cvHTML);
        });
    }

    // Global function for removal
    window.removeItem = (type, id) => {
        if(type === 'experience') {
            experiences = experiences.filter(item => item.id != id);
            renderList('experience');
        } else {
            educations = educations.filter(item => item.id != id);
            renderList('education');
        }
    };

    document.getElementById('addExpBtn').addEventListener('click', () => {
        experiences.push({ id: generateId(), title: '', company: '', date: '', desc: '' });
        renderList('experience');
    });

    document.getElementById('addEduBtn').addEventListener('click', () => {
        educations.push({ id: generateId(), degree: '', school: '', date: '', desc: '' });
        renderList('education');
    });

    // Initial Render
    renderList('experience');
    renderList('education');

    // --- Template Switching ---
    const templateBtns = document.querySelectorAll('.btn-template');
    const cvDocument = document.getElementById('cvPreview');

    templateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            templateBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');

            // Remove all template classes from document
            cvDocument.classList.remove('template-classic', 'template-modern', 'template-minimal', 'template-elegant');
            
            // Add selected template class (except classic which is default)
            const template = e.target.getAttribute('data-template');
            if (template !== 'template-classic') {
                cvDocument.classList.add(template);
            }
        });
    });


    // --- Print functionality ---
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });
});
