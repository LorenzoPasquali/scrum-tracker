// Formata hora e minuto
function getCurrentTime() {
  const now = new Date();
  return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
}

// Carrega histórico
async function load() {
  const res = await fetch('/api/entries');
  const entries = await res.json();
  render(entries);
}

// Envia PUT para atualizar tarefa
async function updateTask(date, type, id, newText) {
  await fetch('/api/task', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, type, id, text: newText })
  });
}

// Inline edit
function enableInlineEdit(span, date, type, id) {
  const currentText = span.textContent.split('] ')[1];
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.className = 'border p-1 rounded flex-1';
  span.replaceWith(input);
  input.focus();

  const finish = async (save) => {
    if (save && input.value.trim() !== currentText) {
      await updateTask(date, type, id, input.value.trim());
    }
    input.replaceWith(span);
    span.textContent = `[${span.textContent.slice(1,6)}] ${save ? input.value.trim() : currentText}`;
    load();
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      finish(true);
    } else if (e.key === 'Escape') {
      finish(false);
    }
  });
}

// Renderiza entries com botões
function render(entries) {
  const container = document.getElementById('history');
  container.innerHTML = '';
  entries.sort((a,b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

  entries.forEach(e => {
    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 bg-gray-50 rounded-lg shadow';
    const dateTitle = document.createElement('div');
    dateTitle.className = 'text-sm text-gray-500 mb-2';
    dateTitle.textContent = e.date;
    wrapper.appendChild(dateTitle);

    ['did','will'].forEach(type => {
      const title = document.createElement('div');
      title.innerHTML = `<strong>${ type==='did'? 'O que fiz Ontem':'O que pretendo fazer hoje' }:</strong>`;
      title.className = 'mb-1';
      wrapper.appendChild(title);
      const ul = document.createElement('ul'); ul.className='list-disc list-inside mb-2';
      e[type].forEach(t => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center';

        const span = document.createElement('span');
        span.textContent = `[${t.time}] ${t.text}`;
        span.className = 'flex-1';
        li.appendChild(span);

        const btns = document.createElement('span');
        btns.innerHTML = 
          `<button data-id="${t.id}" data-date="${e.date}" data-type="${type}" class="edit px-2">✏️</button>
           <button data-id="${t.id}" data-date="${e.date}" data-type="${type}" class="delete px-2">🗑️</button>`;
        li.appendChild(btns);
        ul.appendChild(li);
      });
      wrapper.appendChild(ul);
    });
    container.appendChild(wrapper);
  });

  // Vincula eventos de editar/deletar
  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const date = btn.dataset.date;
      const type = btn.dataset.type;
      const span = btn.parentElement.previousSibling;
      enableInlineEdit(span, date, type, id);
    });
  });
  document.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir essa tarefa?')) return;
      const id = Number(btn.dataset.id);
      const date = btn.dataset.date;
      const type = btn.dataset.type;
      await fetch('/api/task', {
        method: 'DELETE',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ date, type, id })
      });
      load();
    });
  });
}

// Função para adicionar tarefa
async function addTask(type) {
  const inputId = type==='did'? 'task-did':'task-will';
  const input = document.getElementById(inputId);
  const date = document.getElementById('date').value;
  const text = input.value.trim();
  if (!date||!text) return;
  const time = getCurrentTime();
  await fetch('/api/task', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ date, type, text, time })
  });
  input.value = '';
  load();
}

document.getElementById('add-did').addEventListener('click', ()=> addTask('did'));
document.getElementById('add-will').addEventListener('click', ()=> addTask('will'));
['task-did','task-will'].forEach(id=>{
  document.getElementById(id).addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); addTask(id==='task-did'?'did':'will'); }
  });
});

window.onload = load;