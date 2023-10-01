//
//
var xmlhttp = new XMLHttpRequest();
var last_section = "";


function copy_search(e, target_id){
    e.preventDefault();
    var section_el = document.getElementsByTagName('section');
    let search_string;

    for (i = 0; i < (section_el.length); i++){
        let search_id = section_el[i].getElementsByTagName("label")[0].getAttribute("value");

        if (search_id == target_id){
            search_string = section_el[i].getElementsByTagName("div")[0].getElementsByTagName("p")[3].innerText;
        }
    }

    const el = document.createElement('textarea');
    el.value = search_string;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}


function create_entries(event, form_obj){
    event.preventDefault();
    console.log(form_obj);
    data = {
        "title":form_obj.elements['title'].value,
        "tags":form_obj.elements['tags'].value,
        "logic":form_obj.elements['logic'].value,
        "description":form_obj.elements['description'].value,
        "author":form_obj.elements['author'].value
    }
    rest_api('POST', 'create', {"data":data}, show_action);
}


function update_entries(event, form_obj, target_id){
    event.preventDefault();

    data = {
        "title":form_obj.elements['title'].value,
        "tags":form_obj.elements['tags'].value,
        "logic":form_obj.elements['logic'].value,
        "uid":target_id
    }
    rest_api('POST', 'update', {"data":data}, show_action);
}


function search_entries(event, form_obj, table){
    event.preventDefault();

    tags = form_obj.elements['tags'].value;

    if (table == "search"){
        rest_api('POST', 'search', {"data":{"tags":tags}}, build_results_search);
    } else if (table == "rp_build"){
        rest_api('POST', 'search', {"data":{"tags":tags}}, build_results_rp);
    } 
}


function build_results_search(response){
    const resultList = document.getElementById('showResults');
    resultList.innerHTML = '';

    var searches = response["data"]["entries"];
    var slices = response["data"]["slices"];

    searches.forEach(value => {
        const listItem = document.createElement('li');
        listItem.id = `${value[1]}`
        listItem.innerHTML = `
        <div class="entry_display" id="show_${value[1]}">
            <p>Title: ${value[0]}</p>
            <p>Tags: ${value[2]}</p>
            <p>Logic: ${value[3]}</p>
            <button onclick="hide_button(event, '${value[1]}','show')">Edit</button>
        </div>
        <form class="entry_edit" id="edit_${value[1]}" style="display: none;" onsubmit="update_entries(event, this, '${value[1]}')"">
            <p>Title: <input type="text" name="title" value="${value[0]}"></p>
            <p>Tag: <input type="text" name="tags" value="${value[2]}"></p>
            <p>Logic: <input type="text" name="logic" value="${value[3]}"></p>
            <button type="submit">Update</button>
            <button onclick="hide_button(event, '${value[1]}','hide')">Cancel</button>
            <p id="action-result">
        </form>`;

        resultList.appendChild(listItem);

    });
}


function show_action(response){
    const resultList = document.getElementById('action-result');
    var actionResult = response["data"]["actionResult"];
    resultList.innerHTML = `<b>${actionResult}</b>`;
}


function send_rp(event){
    event.preventDefault();
    data = {
        "uIDs":rp_entries_ids
    };
    rest_api('POST', 'generate_rp', {"data":data});
}


function build_results_rp(response){
    const resultList = document.getElementById('showResults');
    resultList.innerHTML = '';

    var searches = response["data"]["entries"];
    var slices = response["data"]["slices"];

    searches.forEach(value => {
        const listItem = document.createElement('li');
        listItem.id = `${value[1]}`
        listItem.innerHTML = `
        <div class="entry_display" id="show_${value[1]}">
            <p>Title: ${value[0]}</p>
            <p>Tags: ${value[2]}</p>
            <p>Logic: ${value[3]}</p>
            <button onclick="add_rp_entry(event, '${value}')">Add</button>
        </div>`;

        resultList.appendChild(listItem);
    });
}


var rp_entries_ids = [];
var rp_entries = [];
function rebuild_rp_table_results(){
    const resultList = document.getElementById('showRPLogics');
    resultList.innerHTML = '';

    rp_entries.forEach(value => {
        const listItem = document.createElement('li');
        listItem.id = `${value[1]}`
        listItem.innerHTML = `
        <div class="entry_display" id="show_${value[1]}">
            <p>Title: ${value[0]}</p>
            <p>Tags: ${value[2]}</p>
            <p>Logic: ${value[3]}</p>
            <button onclick="remove_rp_entry(event, '${value[1]}')">Remove</button>
        </div>`;

        resultList.appendChild(listItem);
    });
}


function remove_rp_entry(event, uid){
    var target_index = -1;

    for (var i = 0; i < rp_entries_ids.length; i++) {
        if (uid == rp_entries_ids[i]) {
            target_index = i;
        }
    }
    rp_entries_ids.splice(target_index, 1);
    rp_entries.splice(target_index, 1);

    rebuild_rp_table_results();
}

function add_rp_entry(event, entry){
    var entry = entry.split(',');
    rp_entries_ids.push(entry[1]);
    rp_entries.push(entry);
    rebuild_rp_table_results();
}


// JavaScript code to handle the "Hide" button click
function hide_button(event, id, action){
    event.preventDefault();
    var edit_element = document.getElementById(`edit_${id}`);
    var show_element = document.getElementById(`show_${id}`);

    if (action == 'show') {
        // If the element is currently hidden, show it
        show_element.style.display = 'none';
        edit_element.style.display = 'block';
    } else {
        // If the element is currently visible, hide it
        show_element.style.display = 'block';
        edit_element.style.display = 'none';
    }
}


function rest_api(method, endpoint, data, actionFunction=null) {
    // if either the user has requested a force update on bot data or the user has added a new market to trade then send an update to the backend.
    xmlhttp.open(method, 'rest-api/'+endpoint, true);
    xmlhttp.setRequestHeader('content-type', 'application/json');
    console.log(method, 'rest-api/'+endpoint);

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4) { // Check if the request is complete
            if (xmlhttp.status === 200) { // Check if the response status is OK (HTTP 200)
                // Parse the JSON response, if applicable
                const response = JSON.parse(xmlhttp.responseText);
                console.log('Response:', response);
                if (actionFunction) {
                    actionFunction(response);
                }

                // Handle the response data here
                // You can update the page or perform other actions based on the data
            } else {
                console.error('Error:', xmlhttp.status);
            }
        }
    };

    xmlhttp.send(JSON.stringify(data));
}
