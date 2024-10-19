App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadWeb3();
        await App.loadAccount(); 
        await App.loadContract();
        await App.render();
    },

    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            web3 = new Web3(web3.currentProvider);
            App.web3Provider = web3.currentProvider;
        } else {
            alert("Please connect to MetaMask.");
        }

        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                await ethereum.enable();
            } catch (error) {
                console.error("User denied account access");
            }
        } else if (window.web3) {
            App.web3Provider = web3.currentProvider;
            window.web3 = new Web3(web3.currentProvider);
        } else {
            console.log('Non-Ethereum browser detected.');
        }
    },

    loadAccount: async () => {
        const accounts = await web3.eth.getAccounts();
        App.account = accounts[0];
        console.log(App.account);
    },

    loadContract: async () => {
        const todoListJSON = await $.getJSON('/todoJSON');
        App.contracts.TodoList = TruffleContract(todoListJSON);
        App.contracts.TodoList.setProvider(App.web3Provider);

        App.todoList = await App.contracts.TodoList.deployed();
    },

    render: async () => {
        if (App.loading) return;

        App.setLoading(true);
        $('#account').text(App.account);

        await App.renderTasks();
        App.setLoading(false);
    },

    renderTasks: async () => {
        const taskCount = await App.todoList.taskCount();
        const $taskTemplate = $('.taskTemplate');
    
        $('#taskList').empty();
        $('#completedTaskList').empty();

        for (let i = 1; i <= taskCount; i++) {
            const task = await App.todoList.tasks(i);
            const taskId = task[0].toNumber();
            const taskContent = task[1];
            const taskCompleted = task[2];

            const $newTaskTemplate = $taskTemplate.clone();
            $newTaskTemplate.find('.task-content').text(taskContent);
            $newTaskTemplate.find('input')
                            .prop('name', taskId)
                            .prop('checked', taskCompleted)
                            .on('click', App.toggleCompleted);

            if (taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate);
            } else {
                $('#taskList').append($newTaskTemplate);
            }

            $newTaskTemplate.show();
        }
    },

    createTask: async () => {
        const content = $('#newTask').val();
        App.setLoading(true);
        await App.todoList.createTask(content, { from: App.account });
        window.location.reload();
    },

    toggleCompleted: async (e) => {
        const taskId = e.target.name;
        App.setLoading(true);
        await App.todoList.toggleCompleted(taskId, { from: App.account });
        window.location.reload();
    },

    setLoading: (isLoading) => {
        App.loading = isLoading;
        if (isLoading) {
            $('#loader').show();
            $('#content').hide();
        } else {
            $('#loader').hide();
            $('#content').show();
        }
    }
};

$(() => {
    window.addEventListener('load', () => {
        App.load();
    });
});
