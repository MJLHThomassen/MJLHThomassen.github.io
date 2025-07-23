const newTodo = document.getElementById('new-todo');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const listSelect = document.getElementById('list-select');
const newListBtn = document.getElementById('new-list-btn');
const renameListBtn = document.getElementById('rename-list-btn');
const deleteListBtn = document.getElementById('delete-list-btn');
const searchTodo = document.getElementById('search-todo');

let currentListId = 'default';
let lists = {};

// Initialize lists from localStorage
function initializeLists()
{
    const savedLists = JSON.parse(localStorage.getItem('todoLists')) || {};
    const savedCurrentListId = localStorage.getItem('currentListId');

    if (Object.keys(savedLists).length === 0)
    {
        // Create default list if none exist
        lists = {
            'default': {
                name: 'My Todo List',
                todos: JSON.parse(localStorage.getItem('todos')) || []
            }
        };
        currentListId = 'default';
        // Remove old todos key
        localStorage.removeItem('todos');
    } else
    {
        lists = savedLists;
        // Use saved currentListId if it exists and the list still exists
        if (savedCurrentListId && lists[savedCurrentListId])
        {
            currentListId = savedCurrentListId;
        } else
        {
            // Fall back to first available list if saved list doesn't exist
            currentListId = Object.keys(lists)[0];
        }
    }
    saveCurrentListId();
    updateListSelector();
    loadCurrentList();
}

// Save all lists to localStorage
function saveLists()
{
    localStorage.setItem('todoLists', JSON.stringify(lists));
}

// Save current list ID to localStorage
function saveCurrentListId()
{
    localStorage.setItem('currentListId', currentListId);
}

// Update the list selector dropdown
function updateListSelector()
{
    listSelect.innerHTML = '';
    Object.keys(lists).forEach(listId =>
    {
        const option = document.createElement('option');
        option.value = listId;
        option.textContent = lists[listId].name;
        if (listId === currentListId)
        {
            option.selected = true;
        }
        listSelect.appendChild(option);
    });
}

// Load todos from localStorage for current list
function loadCurrentList()
{
    renderTodoList();
    // Clear search when switching lists
    searchTodo.value = '';
}

// Render todos from data to DOM
function renderTodoList()
{
    todoList.innerHTML = '';
    if (!lists[currentListId] || !lists[currentListId].todos)
    {
        return;
    }

    lists[currentListId].todos.forEach((todo, index) =>
    {
        renderTodoItem(todo, index);
    });
}

// Render a single todo item
function renderTodoItem(todo, index)
{
    const li = document.createElement('li');
    li.dataset.index = index;

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.onchange = () => toggleTodo(index);

    // Create span for text content
    const span = document.createElement('span');
    span.textContent = todo.text;
    span.className = 'todo-content';
    span.onclick = () => toggleTodo(index);

    // Create tooltip
    renderTooltip(span, todo.createdAt, todo.completedAt);

    // Create edit button
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.className = 'edit-btn';
    editBtn.title = 'Edit';
    editBtn.onclick = () => editTodo(index);

    // Create delete button
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '🗑️';
    delBtn.className = 'delete-btn';
    delBtn.title = 'Delete';
    delBtn.onclick = () => deleteTodo(index);

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.appendChild(editBtn);
    buttonGroup.appendChild(delBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(buttonGroup);

    if (todo.completed)
    {
        li.classList.add('completed');
    }

    todoList.appendChild(li);
}

// Filter todos based on search query
function filterTodos()
{
    const searchQuery = searchTodo.value.toLowerCase().trim();
    const listItems = todoList.querySelectorAll('li');

    listItems.forEach((li, index) =>
    {
        const todo = lists[currentListId].todos[index];
        if (searchQuery === '' || todo.text.toLowerCase().includes(searchQuery))
        {
            li.style.display = 'flex';
        } else
        {
            li.style.display = 'none';
        }
    });
}

// Format date for display
function formatDate(dateString)
{
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Render tooltip content
function renderTooltip(spanElement, createdAt, completedAt)
{
    // Remove existing tooltip
    const existingTooltip = spanElement.querySelector('.tooltip');
    if (existingTooltip)
    {
        existingTooltip.remove();
    }

    // Create new tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';

    let tooltipText = `Created: ${formatDate(createdAt)}`;
    if (completedAt)
    {
        tooltipText += `\nCompleted: ${formatDate(completedAt)}`;
    }

    tooltip.textContent = tooltipText;
    tooltip.style.whiteSpace = 'pre-line'; // Allow line breaks
    spanElement.appendChild(tooltip);
}

// List management functions
function createNewList()
{
    const name = prompt('Enter name for new list:');
    if (name && name.trim())
    {
        const listId = 'list_' + Date.now();
        lists[listId] = {
            name: name.trim(),
            todos: []
        };
        currentListId = listId;
        updateListSelector();
        loadCurrentList();
        saveLists();
        saveCurrentListId();
    }
}

function renameCurrentList()
{
    const currentName = lists[currentListId].name;
    const newName = prompt('Enter new name for list:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName)
    {
        lists[currentListId].name = newName.trim();
        updateListSelector();
        saveLists();
    }
}

function deleteCurrentList()
{
    if (Object.keys(lists).length <= 1)
    {
        alert('Cannot delete the last list!');
        return;
    }

    const listName = lists[currentListId].name;
    if (confirm(`Are you sure you want to delete "${listName}"?`))
    {
        delete lists[currentListId];
        // Switch to first available list
        currentListId = Object.keys(lists)[0];
        updateListSelector();
        loadCurrentList();
        saveLists();
        saveCurrentListId();
    }
}

function switchList()
{
    currentListId = listSelect.value;
    loadCurrentList();
    saveCurrentListId();
}

// Data manipulation functions - these work with the data objects directly

function addTodo(text, completed = false, createdAt = null, completedAt = null)
{
    if (!text.trim()) return;

    if (!lists[currentListId])
    {
        lists[currentListId] = { name: 'New List', todos: [] };
    }

    const todo = {
        text: text.trim(),
        completed: completed,
        createdAt: createdAt || new Date().toISOString(),
        completedAt: completedAt
    };

    lists[currentListId].todos.push(todo);
    saveLists();
    renderTodoList();
}

function toggleTodo(index)
{
    const todo = lists[currentListId].todos[index];
    if (!todo) return;

    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date().toISOString() : null;

    saveLists();
    renderTodoList();
}

function editTodo(index)
{
    const todo = lists[currentListId].todos[index];
    if (!todo) return;

    const li = todoList.querySelector(`li[data-index="${index}"]`);
    if (!li) return;

    const span = li.querySelector('span');
    const currentText = todo.text;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'todo-input';

    // Get the button group and buttons
    const buttonGroup = li.querySelector('.button-group');
    const editBtn = buttonGroup.querySelector('.edit-btn');
    const delBtn = buttonGroup.querySelector('.delete-btn');

    // Create save and cancel buttons
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '✓';
    saveBtn.className = 'edit-btn';
    saveBtn.title = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '✕';
    cancelBtn.className = 'delete-btn';
    cancelBtn.title = 'Cancel';

    const saveEdit = () =>
    {
        const newText = input.value.trim();
        if (newText && newText !== currentText)
        {
            todo.text = newText;
            saveLists();
        }
        renderTodoList();
    };

    const cancelEdit = () =>
    {
        renderTodoList();
    };

    // Set up button event listeners
    saveBtn.onclick = saveEdit;
    cancelBtn.onclick = cancelEdit;

    input.addEventListener('keydown', (e) =>
    {
        if (e.key === 'Enter')
        {
            saveEdit();
        } else if (e.key === 'Escape')
        {
            cancelEdit();
        }
    });

    // Replace buttons with save/cancel buttons
    buttonGroup.replaceChild(saveBtn, editBtn);
    buttonGroup.replaceChild(cancelBtn, delBtn);

    li.replaceChild(input, span);
    input.focus();
    input.select();
}

function deleteTodo(index)
{
    if (!lists[currentListId] || !lists[currentListId].todos[index]) return;

    lists[currentListId].todos.splice(index, 1);
    saveLists();
    renderTodoList();
}

// Event listeners
addBtn.onclick = () =>
{
    addTodo(newTodo.value);
    newTodo.value = '';
    newTodo.focus();
};

newTodo.addEventListener('keydown', e =>
{
    if (e.key === 'Enter')
    {
        addBtn.click();
    }
});

// Search functionality
searchTodo.addEventListener('input', filterTodos);

// Event listeners for list management
newListBtn.onclick = createNewList;
renameListBtn.onclick = renameCurrentList;
deleteListBtn.onclick = deleteCurrentList;
listSelect.onchange = switchList;

// Load todos when the page loads
window.addEventListener('load', initializeLists);
