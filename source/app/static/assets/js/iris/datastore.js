
function load_datastore() {
    get_request_api('/datastore/list/tree')
    .done(function (data){
        if(notify_auto_api(data, true)){
            $('#ds-tree-root').empty();
            build_ds_tree(data.data, 'ds-tree-root');
            reparse_activate_tree();
            show_datastore();
        }
    });
}

function build_ds_tree(data, tree_node) {
    for (node in data) {

        if (data[node] === null) {
            break;
        }

        if (data[node].type == 'directory') {
            data[node].name = sanitizeHTML(data[node].name);
            can_delete = '';
            if (!data[node].is_root) {
                can_delete = `<div class="dropdown-divider"></div><a href="#" class="dropdown-item text-danger" onclick="delete_ds_folder('${node}');"><small class="fa fa-trash mr-2"></small>Delete</a>`;
            }
            jnode = `<li>
                    <span data-node-id="${node}"><i class="fa-regular fa-folder"></i> ${data[node].name}</span> <i class="fas fa-plus ds-folder-menu" role="menu" style="cursor:pointer;" data-toggle="dropdown" aria-expanded="false"></i>
                        <div class="dropdown-menu" role="menu">
                                <a href="#" class="dropdown-item" onclick="add_ds_folder('${node}');return false;"><small class="fa-solid fa-folder mr-2"></small>Add subfolder</a>
                                <a href="#" class="dropdown-item" onclick="add_ds_file('${node}');return false;"><small class="fa-solid fa-file mr-2"></small>Add file</a>
                                <a href="#" class="dropdown-item" onclick="rename_ds_folder('${node}', '${data[node].name}');return false;"><small class="fa-solid fa-pencil mr-2"></small>Rename</a>
                                ${can_delete}
                        </div>
                    <ul id='tree-${node}'></ul>
                </li>`;
            $('#'+ tree_node).append(jnode);
            build_ds_tree(data[node].children, 'tree-' + node);
        } else {
            data[node].file_original_name = sanitizeHTML(data[node].file_original_name);
            if (data[node].file_is_ioc) {
                icon = 'fa-solid fa-virus-covid text-danger';
            } else if (data[node].file_is_evidence) {
                icon = 'fa-solid fa-file-shield text-success';
            } else {
                icon = 'fa-regular fa-file';
            }
            jnode = `<li>
                <span data-file-id="${node}" id='${node}'><span role="menu" style="cursor:pointer;" data-toggle="dropdown" aria-expanded="false"><i class="${icon} mr-1"></i> ${data[node].file_original_name}</span>
                        <div class="dropdown-menu" role="menu">
                                <a href="#" class="dropdown-item" onclick="get_link_ds_file('${node}');return false;"><small class="fa fa-link mr-2"></small>Link</a>
                                <a href="#" class="dropdown-item" onclick="get_mk_link_ds_file('${node}', '${data[node].file_original_name}', '${icon}');return false;"><small class="fa-brands fa-markdown mr-2"></small>Markdown link</a>
                                <a href="#" class="dropdown-item" onclick="download_ds_file('${node}', '${data[node].file_original_name}');return false;"><small class="fa-solid fa-download mr-2"></small>Download</a>
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item" onclick="edit_ds_file('${node}');return false;"><small class="fa fa-eye mr-2"></small>Info</a>
                                <a href="#" class="dropdown-item" onclick="edit_ds_file('${node}');return false;"><small class="fa fa-pencil mr-2"></small>Edit</a>
                                <a href="#" class="dropdown-item" onclick="move_ds_file('${node}');return false;"><small class="fa fa-arrow-right-arrow-left mr-2"></small>Move</a>
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item text-danger" onclick="delete_ds_file('${node}');"><small class="fa fa-trash mr-2"></small>Delete</a>
                        </div>
                    </span>
                </li>`;
            $('#'+ tree_node).append(jnode);
        }
    }
}

function show_datastore() {
    $('html').addClass('ds_sidebar_open');
    $('.ds-sidebar-toggler').addClass('toggled');
}

function hide_datastore() {
    $('html').removeClass('ds_sidebar_open');
    $('.ds-sidebar-toggler').removeClass('toggled');
}

function reparse_activate_tree() {
    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
    $('.tree li.parent_li > span').on('click', function (e) {
        var children = $(this).parent('li.parent_li').find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Expand this branch').find(' > i').addClass('icon-plus-sign').removeClass('icon-minus-sign');
        } else {
            children.show('fast');
            $(this).attr('title', 'Collapse this branch').find(' > i').addClass('icon-minus-sign').removeClass('icon-plus-sign');
        }
        e.stopPropagation();
    });
}

function add_ds_folder(parent_node) {
    $('#ds_mod_folder_name').data('parent-node', parent_node);
    $('#ds_mod_folder_name').data('node-update', false);
    $('#ds_mod_folder_name').val('');
    $('#modal_ds_folder').modal("show");
}

function rename_ds_folder(parent_node, name) {
    $('#ds_mod_folder_name').data('parent-node', parent_node);
    $('#ds_mod_folder_name').data('node-update', true);
    $('#ds_mod_folder_name').val(name);
    $('#modal_ds_folder').modal("show");
}

function delete_ds_folder(node) {
    node = node.replace('d-', '');
    swal({
        title: "Are you sure?",
        text: "This will delete all files included and sub-folders",
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            get_request_api('/datastore/folder/delete/' + node)
            .done((data) => {
                if (notify_auto_api(data)) {
                    load_datastore();
                }
            });
        } else {
            swal("Pfew, that was close");
        }
    });
}

function save_ds_mod_folder() {
    var data = Object();

    data['parent_node'] = $('#ds_mod_folder_name').data('parent-node').replace('d-', '');
    data['folder_name'] =  $('#ds_mod_folder_name').val();
    data['csrf_token'] = $('#csrf_token').val();

    if ($('#ds_mod_folder_name').data('node-update')) {
        uri = '/datastore/folder/rename/' + data['parent_node'];
    } else {
        uri = '/datastore/folder/add';
    }

    post_request_api(uri, JSON.stringify(data))
    .done(function (data){
        if(notify_auto_api(data)){
            $('#modal_ds_folder').modal("hide");
            load_datastore();
        }
    });
}

function add_ds_file(node) {
    node = node.replace('d-', '');
    url = '/datastore/file/add/'+ node +'/modal' + case_param();
    $('#modal_ds_file_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        $('#modal_ds_file').modal("show");
    });
}

function edit_ds_file(node) {
    node = node.replace('f-', '');
    url = '/datastore/file/update/'+ node +'/modal' + case_param();
    $('#modal_ds_file_content').load(url, function (response, status, xhr) {
        if (status !== "success") {
             ajax_notify_error(xhr, url);
             return false;
        }

        $('#modal_ds_file').modal("show");
    });
}

function save_ds_file(node, file_id) {
    var formData = new FormData($('#form_new_ds_file')[0]);
    formData.append('file_content', $('#input_upload_ds_file').prop('files')[0]);

    if (file_id === undefined) {
        uri = '/datastore/file/add/' + node;
    } else {
        uri = '/datastore/file/update/' + file_id;
    }

    post_request_data_api(uri, formData, true)
    .done(function (data){
        if(notify_auto_api(data)){
            $('#modal_ds_file').modal("hide");
            load_datastore();
        }
    })
}

function move_ds_file(file_id) {
    reparse_activate_tree_selection();
    $('#' + file_id).addClass('file-selected');
    $('#msg_select_destination_folder').show();
}

function validate_ds_file_move() {
    var data_sent = Object();
    data_sent['destination-node'] = $(".node-selected").data('node-id').replace('d-', '');
    data_sent['csrf_token'] = $('#csrf_token').val();

    file_id = $(".file-selected").data('file-id').replace('f-', '');

    post_request_api('/datastore/file/move/' + file_id, JSON.stringify(data_sent))
    .done((data) => {
        if (notify_auto_api(data)) {
            $(".node-selected").removeClass("node-selected");
            $('#msg_select_destination_folder').attr("data-file-id", '');
            $('#msg_select_destination_folder').hide();
            load_datastore();
        }
    });
}

function delete_ds_file(file_id) {
    file_id = file_id.replace('f-', '');
    swal({
        title: "Are you sure?",
        text: "This will delete the file on the server and any manual reference will become invalid",
        icon: "warning",
        buttons: true,
        dangerMode: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    })
    .then((willDelete) => {
        if (willDelete) {
            get_request_api('/datastore/file/delete/' + file_id)
            .done((data) => {
                if (notify_auto_api(data)) {
                    load_datastore();
                }
            });
        } else {
            swal("Pfew, that was close");
        }
    });
}

function get_link_ds_file(file_id) {

   file_id = file_id.replace('f-', '');

   link = location.protocol + '//' + location.host + '/datastore/file/view/' + file_id;
   link = link + case_param();

   navigator.clipboard.writeText(link).then(function() {
          notify_success('File link copied')
    }, function(err) {
        notify_error('Unable to copy link. Error ' + err);
        console.error('File link link', err);
    });

}

function build_dsfile_view_link(file_id) {
   file_id = file_id.replace('f-', '');

   link = location.protocol + '//' + location.host + '/datastore/file/view/' + file_id;
   link = link + case_param();

   return link;
}

function get_mk_link_ds_file(file_id, filename, file_icon) {

   link = build_dsfile_view_link(file_id);

   if (['png', 'svg', 'jpeg', 'jpg', 'webp', 'bmp', 'gif'].includes(filename.split('.').pop())) {
        mk_link = `![${filename}](${link})`;
    } else {
        mk_link = `[<i class="${file_icon} mr-1"></i>[DS] ${filename}](${link})`;
    }

   navigator.clipboard.writeText(mk_link).then(function() {
          notify_success('Markdown file link copied')
    }, function(err) {
        notify_error('Unable to copy link. Error ' + err);
        console.error('Markdown file link  link', err);
    });

}

function download_ds_file(file_id, filename) {
    link = build_dsfile_view_link(file_id);
    downloadURI(link, name);
}


function reparse_activate_tree_selection() {
    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
    $('.tree li.parent_li > span').on('click', function (e) {

        if ($(this).hasClass('node-selected')) {
            $(this).removeClass('node-selected');
        } else {
            $(".node-selected").removeClass("node-selected");
            $(this).addClass('node-selected');
        }
        e.stopPropagation();
    });
}