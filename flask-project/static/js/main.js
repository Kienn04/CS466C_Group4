document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const closingTimers = new WeakMap();

    const profileMenu = document.querySelector('.profile-menu');
    if (profileMenu) {
        const trigger = profileMenu.querySelector('[data-menu-toggle]');
        trigger?.addEventListener('click', (event) => {
            event.stopPropagation();
            profileMenu.classList.toggle('open');
        });
        document.addEventListener('click', (event) => {
            if (!profileMenu.contains(event.target)) {
                profileMenu.classList.remove('open');
            }
        });
    }

    document.querySelectorAll('[data-close-flash]').forEach((button) => {
        button.addEventListener('click', (event) => {
            const flash = event.currentTarget.closest('.flash');
            if (!flash) return;
            flash.classList.add('closing');
            setTimeout(() => flash.remove(), 180);
        });
    });

    const modals = new Map();
    document.querySelectorAll('.modal').forEach((modal) => {
        modals.set(modal.id, modal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

    function openModal(modal) {
        if (closingTimers.has(modal)) {
            clearTimeout(closingTimers.get(modal));
            closingTimers.delete(modal);
        }
        modal.removeAttribute('hidden');
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('show');
        const timer = setTimeout(() => {
            modal.setAttribute('hidden', 'true');
            closingTimers.delete(modal);
        }, 220);
        closingTimers.set(modal, timer);
        body.style.overflow = '';
    }

    document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-modal-open');
            const modal = modals.get(targetId);
            if (!modal) return;
            if (targetId === 'task-modal') {
                prepareTaskForm(modal, trigger.getAttribute('data-mode') === 'create', trigger.dataset);
            }
            openModal(modal);
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach((button) => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) closeModal(modal);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            modals.forEach((modal) => {
                if (!modal.hasAttribute('hidden')) {
                    closeModal(modal);
                }
            });
        }
    });

    const taskModal = document.getElementById('task-modal');
    let taskForm;
    let titleTarget;
    let createTitle = '';
    let editTitle = '';
    let assigneeSelect;

    if (taskModal) {
        taskForm = taskModal.querySelector('[data-task-form]');
        titleTarget = taskModal.querySelector('[data-task-modal-title]');
        const dialog = taskModal.querySelector('.modal-dialog');
        createTitle = dialog?.dataset.titleCreate || 'New Task';
        editTitle = dialog?.dataset.titleEdit || 'Edit Task';
        assigneeSelect = taskModal.querySelector('select[name="assignee_id"]');

        document.querySelectorAll('[data-edit-task]').forEach((button) => {
            button.addEventListener('click', () => {
                const modal = modals.get('task-modal');
                if (!modal) return;
                prepareTaskForm(modal, false, button.dataset);
                openModal(modal);
            });
        });
    }

    function selectAssigneeOption(value) {
        if (!assigneeSelect) return;
        const normalized = value == null ? '' : String(value);
        const options = Array.from(assigneeSelect.options);
        const match = options.find((option) => option.value === normalized);
        if (match) {
            assigneeSelect.value = normalized;
        } else if (options.length) {
            assigneeSelect.value = options[0].value;
        }
    }

    function prepareTaskForm(modal, isCreate, dataset = {}) {
        if (!taskForm || !titleTarget) return;
        taskForm.reset();
        const createAction = taskForm.dataset.createAction;
        const updateTemplate = taskForm.dataset.updateTemplate;
        const titleField = taskForm.querySelector('[name="title"]');
        const descriptionField = taskForm.querySelector('[name="description"]');
        const statusField = taskForm.querySelector('[name="status"]');
        const dueField = taskForm.querySelector('[name="due_date"]');

        if (isCreate) {
            if (createAction) taskForm.action = createAction;
            titleTarget.textContent = createTitle;
            taskForm.dataset.mode = 'create';
            selectAssigneeOption(assigneeSelect?.options?.[0]?.value ?? '0');
            return;
        }

        const id = dataset.id;
        if (!id) return;
        titleTarget.textContent = editTitle;
        taskForm.dataset.mode = 'edit';
        if (updateTemplate) {
            taskForm.action = updateTemplate.replace(/0$/, id);
        }

        if (titleField) titleField.value = dataset.title || '';
        if (descriptionField) descriptionField.value = dataset.description || '';
        if (statusField) statusField.value = dataset.status || statusField.value;
        if (dueField) dueField.value = dataset.due || '';
        const assigneeValue = dataset.assignee ?? assigneeSelect?.options[0]?.value ?? '0';
        selectAssigneeOption(assigneeValue);
    }
    const STATUS_LABELS = {
        todo: 'To do',
        in_progress: 'In progress',
        done: 'Completed',
    };

    const projectSection = document.querySelector('.project-detail');
    if (projectSection) {
        const projectId = projectSection.dataset.projectId;
        const csrfToken = projectSection.dataset.csrf;
        const board = document.querySelector('.task-board');
        if (projectId && board) {
            const cards = board.querySelectorAll('.task-card');
            cards.forEach((card) => wireCard(card));

            const columns = board.querySelectorAll('.task-column');
            columns.forEach((column) => wireColumn(column));
        }

        function wireCard(card) {
            card.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', card.dataset.taskId || '');
                event.dataTransfer.effectAllowed = 'move';
                card.classList.add('dragging');
                const originColumn = card.closest('.task-column');
                card.dataset.originStatus = card.dataset.status || originColumn?.dataset.status || '';
                card.dataset.originIndex = String(
                    Array.from(card.parentElement?.children || []).indexOf(card)
                );
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
        }

        function wireColumn(column) {
            const tasksContainer = getTasksContainer(column);
            column.addEventListener('dragover', (event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                column.classList.add('drop-ready');
                const dragging = board.querySelector('.task-card.dragging');
                if (!dragging) return;
                const afterElement = getDragAfterElement(tasksContainer, event.clientY);
                if (afterElement == null) {
                    tasksContainer.appendChild(dragging);
                } else {
                    tasksContainer.insertBefore(dragging, afterElement);
                }
            });
            column.addEventListener('dragleave', () => {
                column.classList.remove('drop-ready');
            });
            column.addEventListener('drop', (event) => {
                event.preventDefault();
                column.classList.remove('drop-ready');
                const taskId = event.dataTransfer.getData('text/plain');
                if (!taskId) return;
                const newStatus = column.dataset.status;
                if (!newStatus) return;
                const card = board.querySelector(`[data-task-id="${taskId}"]`);
                if (!card || card.dataset.status === newStatus) return;
                const previousStatus = card.dataset.status || card.dataset.originStatus || '';
                const previousIndex = card.dataset.originIndex;
                card.dataset.status = newStatus;
                updateTaskStatus(projectId, taskId, newStatus, csrfToken)
                    .then(() => {
                        card.dataset.originStatus = newStatus;
                        card.dataset.originIndex = String(
                            Array.from(card.parentElement?.children || []).indexOf(card)
                        );
                        const chip = card.querySelector('.chip.subtle');
                        if (chip) {
                            chip.textContent = STATUS_LABELS[newStatus] || newStatus;
                        }
                        const editTrigger = card.querySelector('[data-edit-task]');
                        if (editTrigger) {
                            editTrigger.dataset.status = newStatus;
                        }
                    })
                    .catch(() => {
                        card.dataset.status = previousStatus;
                        const originColumn = board.querySelector(
                            `.task-column[data-status="${card.dataset.originStatus}"]`
                        );
                        const originContainer = getTasksContainer(originColumn);
                        if (originContainer) {
                            const children = Array.from(originContainer.children);
                            const index = Number(previousIndex);
                            if (Number.isInteger(index) && index >= 0 && index < children.length) {
                                originContainer.insertBefore(card, children[index]);
                            } else {
                                originContainer.appendChild(card);
                            }
                        }
                    });
            });
        }

        function getTasksContainer(column) {
            return column?.querySelector('.tasks') || column;
        }

        function getDragAfterElement(container, y) {
            const elements = [...container.querySelectorAll('.task-card:not(.dragging)')];
            return elements.reduce(
                (closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    if (offset < 0 && offset > closest.offset) {
                        return { offset, element: child };
                    }
                    return closest;
                },
                { offset: Number.NEGATIVE_INFINITY, element: null }
            ).element;
        }
    }

    function updateTaskStatus(projectId, taskId, status, csrfToken) {
        return fetch(`/projects/${projectId}/tasks/${taskId}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken || '',
            },
            body: JSON.stringify({ status }),
        }).then((response) => {
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
            return response.json();
        });
    }
});
