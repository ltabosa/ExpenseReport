'use strict';

ExecuteOrDelayUntilScriptLoaded(initializePage, "sp.js");

function initializePage()
{
    var context = SP.ClientContext.get_current();
    var user = context.get_web().get_currentUser();

    // Ce code s'exécute quand le modèle DOM est prêt. Par ailleurs, il crée un objet de contexte nécessaire à l'utilisation du modèle objet SharePoint
    $(document).ready(function () {
        getUserName();
    });

    // Cette fonction prépare, charge, puis exécute une requête SharePoint pour obtenir des informations sur les utilisateurs actuels
    function getUserName() {
        context.load(user);
        context.executeQueryAsync(onGetUserNameSuccess, onGetUserNameFail);
    }

    // Cette fonction est exécutée si l'appel ci-dessus est réussi
    // Elle remplace le contenu de l'élément 'message' par le nom de l'utilisateur
    function onGetUserNameSuccess() {
        $('#message').text('Hello ' + user.get_title());
    }

    // Cette fonction est exécutée en cas d'échec de l'appel ci-dessus
    function onGetUserNameFail(sender, args) {
        alert('Failed to get user name. Error:' + args.get_message());
    }
}
