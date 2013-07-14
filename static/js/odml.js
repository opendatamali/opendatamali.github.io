
var dashboardsListUrl = '/views/dashboards.json';
var indexURL = 'https://raw.github.com/opendatamali/registry/master/datapackage-index.json';
// var indexURL = '/datapackage-index.json';

String.prototype.nl2br = function()
{
    return this.replace(/\n/g, "<br />");
};

String.prototype.clean_url = function ()
{
    if (this.indexOf('http') === 0)
        return this.replace(/^https?\:\/\//, '');
};

String.prototype.url_hostname = function () {
    var getLocation = function(href) {
        var l = document.createElement("a");
        l.href = href;
        return l;
    };
    return getLocation(this).hostname;

};

function getParameterByName( name, href )
{
    if (href === undefined || href === null)
        href = window.location;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( href );
    if( results === null )
        return null;
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function loadPageContent(page) {

    // highlight menu
    var menu = page;
    if (page == 'dataset')
        menu = 'datasets';
    $('.menu-'+menu).addClass('glow focus');

    if (page === null || page === undefined)
        return;

    if (page == 'datasets') {
        return loadDatasetsList();
    }

     if (page == 'dashboards') {
        return loadListOfDashboards();
    }

    if (page == 'dataset') {
        return loadDatasetContent(getParameterByName('id'));
    }

    return;

}

function executeWithDataset(content_id, callback) {
    $.getJSON(indexURL)
        .done(function (data) {
            var ds = data[content_id];
            callback(ds);
        })
        .fail(function (err) {
            console.log("Error retrieving JSON");
        });
}

function loadDatasetsList() {

    $.getJSON(indexURL).done(function (data) {
        var list = $("<ul />");
        list.addClass('dataset-list button-list');
        for (var key in data) {
            var pkg = data[key];
            console.log(pkg);
            var listItem = $("<li />");
            listItem.addClass('datapackage');
            var link = $("<a />");
            link.attr('href', '/dataset/?id=' + pkg.name);
            link.html(pkg.title);
            link.addClass('button button-action');
            listItem.append(link);
            var desc = $("<p/>");
            desc.html(pkg.description.nl2br());
            listItem.append(desc);
            list.append(listItem);
        }

        $(".dataset-list").replaceWith(list);
    });
}

function loadListOfDashboards() {
    $.getJSON(dashboardsListUrl).done(function (data) {
        var list = $("<ul />");
        list.addClass('dashboard-list button-list');
        console.log(data);
        for (var i=0; i<data.length; i++) {
            var dash = data[i];
            console.log(dash);
            var listItem = $("<li />");
            var link = $("<a />");
            link.attr('href', dash.url.content);
            link.html(dash.title);
            link.addClass('button button-action');
            listItem.append(link);
            var desc = $("<p/>");
            desc.html(dash.short_desc);
            listItem.append(desc);
            list.append(listItem);
        }
        $(".dashboard-list").replaceWith(list);
    });
}

function loadDatasetContent(content_id) {
    var content = $('.dataset-content');

    var displayError = function (content_id) {
        content.empty();
        var err_msg = $('<p/>');
        err_msg.html("Impossible de charger le dataset <em>"+ content_id + "</em>");
        content.append(err_msg);
    };

    var displayDatasetDetails = function (dataset) {
        if (dataset === null || dataset === undefined)
            return displayError(content_id);

        var cptr;

        var title = $('<h2 />');
        title.html(dataset.title);

        content.empty();
        content.append(title);

        var row_desc = $('<div/>');
        row_desc.addClass('description-block');

        // description
        var description = getPackageInfo(dataset, 'description');
        if (description !== null) {
            var description_p = $('<p />');
            description_p.addClass('description');
            description_p.html(description);
            row_desc.append(description_p);
        }

        // KEYWORDS
        var keywords = getPackageInfo(dataset, 'keywords');
        if (keywords !== null) {
            var keywords_ul = $('<p class="keywords"/>');
            for (cptr=0; cptr<keywords.length; cptr++) {
                var keyword = keywords[cptr];
                if (keyword === null)
                    continue;
                var keyword_li = $('<span class="label label-info"/>');
                keyword_li.html(keyword);
                keywords_ul.append(keyword_li);
            }
            row_desc.append(keywords_ul);
        }

        // DOWNLOAD LINK
        var download_url = getPackageInfo(dataset, 'download_url');
        if (download_url !== null) {
            var download_p = $('<p/>');
            var download_a = $('<a><i class="icon icon-download"></i> TÉLÉCHARGER LE FICHIER CSV</a>');
            download_a.addClass('button button-action glow');
            download_a.attr('href', download_url);
            download_p.append(download_a);
            row_desc.append(download_p);
        }

        content.append(row_desc);

        // sidebar
        var row_desc_side = $('<div/>');
        row_desc_side.addClass('description-side');

        // HOME PAGE
        var home_url = getPackageInfo(dataset, 'homepage');
        if (home_url !== null) {
            var link_p = $('<p/>');
            var link_a = $('<a />');
            link_a.attr('href', home_url);
            link_a.html(home_url.url_hostname());
            link_p.html('<i class="icon icon-bookmark"> ');
            link_p.attr('title', "Page d'accueil du dataset.");
            link_p.append(link_a);
            row_desc_side.append(link_p);
        }
        // Sources
        var sources = getPackageInfo(dataset, 'sources');
        if (sources !== null) {
            var sources_div = $('<div/>');
            sources_div.append('<h3>Sources</h3>');
            var sources_ul = $('<ul/>');
            sources_ul.addClass('licenses');
            for (cptr=0; cptr<sources.length; cptr++) {
                var source_a = $('<a />');
                var source_name = getPackageInfo(sources[cptr], 'name');
                var source_web = getPackageInfo(sources[cptr], 'web');
                if (source_web === null)
                    continue;
                if (source_name === null)
                    source_name = source_web.clean_url();
                source_a.attr('href', source_web);
                source_a.html(source_name);
                var source_li = $('<li/>');
                source_li.append(source_a);
                sources_ul.append(source_li);
            }
            sources_div.append(sources_ul);
            row_desc_side.append(sources_div);
        }

        content.append(row_desc_side);

        content.append('<div style="clear:both;"></div>');

        // fields
        var resources = getPackageInfo(dataset, 'resources');
        if (resources.length > 0) {
            var fields_div = $('<div/>');
            fields_div.addClass('fields');

            for (cptr=0; cptr<resources.length; cptr++) {
                var resource = resources[cptr];
                var resource_head = $('<h2/>');
                resource_head.html("Description des champs");

                var resource_table = $('<table />');
                resource_table.addClass('table table-striped table-bordered table-hover table-condensed');
                resource_table.append($("<tr><th>Champ</th><th>Ordre</th><th>Type (Format)</th><th>Description</th></tr>"));

                var resource_fields = getPackageInfo(resource.schema, 'fields');
                if (resource_fields === null)
                    continue;

                for (cptr=0; cptr<resource_fields.length; cptr++) {
                    var field = resource_fields[cptr];

                    var f_id = getPackageInfo(field, 'id');
                    var f_label = getPackageInfo(field, 'label');
                    var f_type = getPackageInfo(field, 'type');
                    if (f_type === null)
                        f_type = "string";
                    var f_format = getPackageInfo(field, 'format');
                    var f_description = getPackageInfo(field, 'description');

                    var field_td = $('<td/>');
                    if (f_label !== null)
                        field_td.html(f_label);
                    else
                        field_td.html(f_id);
                    var order_td = $('<td/>');
                    order_td.html(cptr);
                    var type_td = $('<td/>');
                    if (f_format !== null)
                        type_td.html(f_type + " (" + f_format + ")");
                    else
                        type_td.html(f_type);
                    var description_td = $('<td/>');
                    if (f_description !== null)
                        description_td.html(f_description);

                    var resource_tr = $('<tr/>');
                    resource_tr.append(field_td);
                    resource_tr.append(order_td);
                    resource_tr.append(type_td);
                    resource_tr.append(description_td);
                    resource_table.append(resource_tr);
                }

                content.append(resource_head);
                content.append(resource_table);
            }
        }

        // README
        var readme_content = getPackageInfo(dataset, 'readme');
        var readme_html_content = getPackageInfo(dataset, 'readme');
        if (readme_content !== null || readme_html_content !== null) {
            var readme = $('<div />');
            if (readme_html_content !== null)
                readme.html(readme_html_content);
            else {
                var readme_p = $('<p/>');
                readme_p.html(readme_content.nl2br());
                readme.append(readme_p);
            }
            var readme_head = $("<h2>LISEZ MOI</h2>");
            content.append(readme_head);
            content.append(readme);
        }

        // LICENSES
        var licenses_head = $("<h2>Licences d'utilisation</h2>");
        var licenses_ul = $('<ul/>');
        licenses_ul.addClass('licenses');
        var licenses = getPackageInfo(dataset, 'licenses');
        if (licenses === null) {
            licenses = [{id: "unspecified", url: "http://en.wikipedia.org/wiki/Copyright"}];
        }
        for (cptr=0; cptr<licenses.length; cptr++) {
            var licence = licenses[cptr];
            var license_li = $('<li/>');
            var license_a = $('<a/>');
            license_a.attr('href', getPackageInfo(licence, 'url', ''));
            license_a.html(getPackageInfo(licence, 'id', 'unspecified'));
            license_li.append(license_a);
            licenses_ul.append(license_li);
        }
        content.append(licenses_head);
        content.append(licenses_ul);

    };

    executeWithDataset(content_id, displayDatasetDetails);
}

function getPackageInfo(dataset, field, nonevalue) {
    var result = null;
    if (nonevalue !== undefined && nonevalue !== null)
        result = nonevalue;

    if (dataset === undefined || dataset === null)
        return result;

    if (field === undefined || field === null)
        return result;

    if (dataset.hasOwnProperty(field) && dataset[field].length > 0)
        return dataset[field];

    return result;
}