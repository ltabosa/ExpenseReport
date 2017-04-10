'use strict';

//ExecuteOrDelayUntilScriptLoaded(initializePage, "sp.js");//adicionar na pagina de novo TS e tbm na pagina de edicao de TS
ExecuteOrDelayUntilScriptLoaded(getWebProperties, "SP.js");//adicionar na pagina de edicao de timesheet
var itCameFromNewTimesheet = false;

function attachFileToMyTimesheet(userId, monthSubmit, yearSubmit) {
    
        var context = new SP.ClientContext.get_current();
        var oList = context.get_web().get_lists().getByTitle('MyTimesheet');
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml('<View>' +
                                '<Query>' +
                                    '<Where>' +
                                        '<And>' +
                                            '<And>' +
                                                '<Eq>' +
                                                    '<FieldRef Name=\'Title\'/>' +
                                                    '<Value Type=\'Text\'>' + monthSubmit + '</Value>' +
                                                '</Eq>' +
                                                '<Eq>' +
                                                    '<FieldRef Name=\'Year\'/>' +
                                                    '<Value Type=\'Text\'>' + yearSubmit + '</Value>' +
                                                '</Eq>' +
                                            '</And>' +
                                             '<Eq>' +
                                                 '<FieldRef Name=\'ReportOwner\' LookupId=\'TRUE\'/>' +
                                                 '<Value Type=\'User\'>' + userId + '</Value>' +
                                             '</Eq>' +
                                         '</And>' +
                                    '</Where>' +
                                '<OrderBy>' +
                                    '<FieldRef Name=\'Title\' Ascending=\'TRUE\' />' +
                                    '</OrderBy>' +
                                '</Query>' +
                                '<ViewFields>' +
                                    '<FieldRef Name=\'Id\' />' +
                                '</ViewFields>' +
                              '</View>');
        window.collListItem = oList.getItems(camlQuery);
        context.load(collListItem, 'Include(Id)');
        context.executeQueryAsync(Function.createDelegate(this, window.onQuerySucceededAddFileToListMyTimesheet),
        Function.createDelegate(this, window.onQueryFailedToTakeId));
}
function onQueryFailedToTakeId(sender, args) {
    //alert('Query failed. Error: ' + args.get_message());
}

function onQuerySucceededAddFileToListMyTimesheet() {
    var listEnumerator = collListItem.getEnumerator();
    while (listEnumerator.moveNext()) {
        var oListItem = listEnumerator.get_current();
        var itemId = oListItem.get_id();
    }
    addFileToListMyTimesheet(itemId);
}


///******************************************************************************
function addFileToListMyTimesheet(itemId) {

    var listTitle = 'MyTimesheet';
    //var itemId = 1;
    var fileInput = document.getElementById("customFileUploadControl");
    var file = fileInput.files[0];
    if (file != undefined) {
        processUpload(file, listTitle, itemId,
          function () {
              console.log('Attachment file has been uploaded');
              if (itCameFromNewTimesheet) {
                  window.location.href = '../Pages/EditTimesheet.aspx?ID=' + itemId + '&Status=InProgress&Month=' + monthSubmit + '&Year=' + yearSubmit + '';
              }
              //location.reload();
          },
          function (sender, args) {
              console.log(args.get_message());
          });
    } else {
        if (itCameFromNewTimesheet) {
            window.location.href = '../Pages/EditTimesheet.aspx?ID=' + itemId + '&Status=InProgress&Month=' + monthSubmit + '&Year=' + yearSubmit + '';
        }
    }
    function processUpload(fileInput, listTitle, itemId, success, error) {
        var reader = new FileReader();
        reader.onload = function (result) {
            var fileContent = new Uint8Array(result.target.result);
            performAttachmentUpload(listTitle, fileInput.name, itemId, fileContent, success, error);
        };
        reader.readAsArrayBuffer(fileInput);
    }

    function performAttachmentUpload(listTitle, fileName, itemId, fileContent, success, error) {

        ensureAttachmentFolder(listTitle, itemId,
           function (folder) {
               var attachmentFolderUrl = folder.get_serverRelativeUrl();
               uploadFile(attachmentFolderUrl, fileName, fileContent, success, error);
           },
           error);
    }

    function ensureAttachmentFolder(listTitle, itemId, success, error) {
        var ctx = SP.ClientContext.get_current();
        var web = ctx.get_web();
        var list = web.get_lists().getByTitle(listTitle);
        ctx.load(list, 'RootFolder');
        var item = list.getItemById(itemId);
        ctx.load(item);
        ctx.executeQueryAsync(
          function () {
              var attachmentsFolder;
              if (!item.get_fieldValues()['Attachments']) { /* Attachments folder exists? */
                  var attachmentRootFolderUrl = String.format('{0}/Attachments', list.get_rootFolder().get_serverRelativeUrl());
                  var attachmentsRootFolder = ctx.get_web().getFolderByServerRelativeUrl(attachmentRootFolderUrl);
                  //Note: Here is a tricky part. 
                  //Since SharePoint prevents the creation of folder with name that corresponds to item id, we are going to:   
                  //1)create a folder with name in the following format '_<itemid>'
                  //2)rename a folder from '_<itemid>'' into '<itemid>'
                  //This allow to bypass the limitation of creating attachment folders
                  var request;
                  if(window.XMLHttpRequest)
                      request = new XMLHttpRequest();
                  else
                      request = new ActiveXObject("Microsoft.XMLHTTP");
                  request.open('GET', attachmentRootFolderUrl+"/"+itemId, false);
                  request.send(); // there will be a 'pause' here until the response to come.
                  // the object request will be actually modified
                  if (request.status === 404) {
                      attachmentsFolder = attachmentsRootFolder.get_folders().add('_' + itemId);
                      attachmentsFolder.moveTo(attachmentRootFolderUrl + '/' + itemId);
                  } else {
                      var attachmentFolderUrl = String.format('{0}/Attachments/{1}', list.get_rootFolder().get_serverRelativeUrl(), itemId);
                      attachmentsFolder = ctx.get_web().getFolderByServerRelativeUrl(attachmentFolderUrl);
                  }
                  ctx.load(attachmentsFolder);
              }
              else {
                  var attachmentFolderUrl = String.format('{0}/Attachments/{1}', list.get_rootFolder().get_serverRelativeUrl(), itemId);
                  attachmentsFolder = ctx.get_web().getFolderByServerRelativeUrl(attachmentFolderUrl);
                  ctx.load(attachmentsFolder);
              }
              ctx.executeQueryAsync(
                   function () {
                       success(attachmentsFolder);
                   },
                   error);
          },
          error);
    }

    function uploadFile(folderUrl, fileName, fileContent, success, error) {
        var ctx = SP.ClientContext.get_current();
        var folder = ctx.get_web().getFolderByServerRelativeUrl(folderUrl);
        var encContent = new SP.Base64EncodedByteArray();
        for (var b = 0; b < fileContent.length; b++) {
            encContent.append(fileContent[b]);
        }
        var createInfo = new SP.FileCreationInformation();
        createInfo.set_content(encContent);
        createInfo.set_url(fileName);
        folder.get_files().add(createInfo);
        ctx.executeQueryAsync(success, error);
    }
    ///*******************************************************************************
}

function getWebProperties() {
    
    var attachmentFiles;
    if (timesheetId) {
        var itemId = timesheetId;
    } else itemId = null;
    var ctx = new SP.ClientContext.get_current();

    var web = ctx.get_web();
    var attachmentFolder = web.getFolderByServerRelativeUrl('Lists/MyTimesheet/Attachments/' + itemId);
    attachmentFiles = attachmentFolder.get_files();
    ctx.load(attachmentFiles);

    ctx.executeQueryAsync(Function.createDelegate(this, onSuccess), Function.createDelegate(this, onFailed));

    function onSuccess(sender, args) {
        var i = 0;
        var html = "";
        var relativeUrl = "";
        for (var file in attachmentFiles) {
            $('#result').html(html);
            if (attachmentFiles.itemAt(i).get_serverRelativeUrl()) {
                relativeUrl = attachmentFiles.itemAt(i).get_serverRelativeUrl();
                var fileName = String(relativeUrl);
                fileName = fileName.split("/");
                fileName = fileName[7];
                html += "<p><a href='" + relativeUrl + "'>" + fileName + "</a>";
                html += "<a onclick='deleteAttach(\"" + fileName + "\")' href='/'> Delete</a></p>";
            }
            i++;
        }
    }

    function onFailed(sender, args) {
        //alert("sorry!");
    }
}

function deleteAttach(fileName) {
    var listTitle = 'MyTimesheet'
    var itemId = timesheetId;

    var ctx = SP.ClientContext.get_current();
    var list = ctx.get_web().get_lists().getByTitle(listTitle);
    var item = list.getItemById(itemId);
    var attachmentFile = item.get_attachmentFiles().getByFileName(fileName);
    attachmentFile.deleteObject();
    ctx.executeQueryAsync(
      function () {
          console.log('Attachment file has been deleted');
          location.reload();
      },
      function (sender, args) {
          console.log(args.get_message());
      });
}

//********************************************************************************************************
function getLastItemId(monthSubmit, yearSubmit) {
    var userId = _spPageContextInfo.userId;
    var caml = "<View><Query><Where>"
        + "<Eq><FieldRef Name='Author' LookupId='TRUE' /><Value Type='Integer'>"
        + userId + "</Value></Eq></Where>"
        + "<OrderBy><FieldRef Name='Created' Ascending='False' /></OrderBy>"
        + "</Query><RowLimit>1</RowLimit></View>";
    var ctx = SP.ClientContext.get_current()
    var web = ctx.get_web()
    var list = web.get_lists().getByTitle("MyTimesheet")
    var query = new SP.CamlQuery();
    query.set_viewXml(caml);
    var items = list.getItems(query);
    ctx.load(items)
    ctx.executeQueryAsync(function () {
        // success actions
        var count = items.get_count();
        //should only be 1
        if (count > 1) {
            throw "Something is wrong. Should only be one latest list item / doc";
        }

        var enumerator = items.getEnumerator();
        enumerator.moveNext();
        var item = enumerator.get_current();
        var id = item.get_id();
        itCameFromNewTimesheet = true;
        // do something with your result!!!!
        //window.location.href = '../Pages/EditTimesheet.aspx?ID=' + id + '&Status="In Progress"&Month=' + monthSubmit + '&Year=' + yearSubmit + '';
        //href='EditTimesheet.aspx?ID=" + oListItem.get_id() + "&Status=" + oListItem.get_item('Status') + "&Month=" + oListItem.get_item('Title') + "&Year=" + oListItem.get_item('Year') + "'
        //alert(id + monthSubmit + yearSubmit);
        addFileToListMyTimesheet(id);

    }, function () {
        //failure handling comes here
        //alert("failed");
    });
}


