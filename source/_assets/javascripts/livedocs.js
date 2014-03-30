var clear_results = function (form) {
  form = $(form);
  form.find('.body').text("");
  form.find('.response-body').addClass('hidden');
  form.find('.response-headers').addClass('hidden');
  form.find('.request-data').addClass('hidden');
  form.find('.data').text("");
  form.find('.headers').text("");
  form.find('.call').text("");
  form.find('.method').text("");

  form.hide();
};

function toggle_livedoc(identifier, show) {
  if (show) {
    $('#parameters-' + identifier).hide();
    $('#apiexample-' + identifier).hide();
    $('#livedoc-' + identifier).show();
    $('#cancel-' + identifier).show();
    $('#tryit-' + identifier).hide();
  }
  else {
    $('#parameters-' + identifier).show();
    $('#apiexample-' + identifier).show();
    $('#livedoc-' + identifier).hide();
    $('#cancel-' + identifier).hide();
    $('#tryit-' + identifier).show();
  }
}

function getParamHtml(data) {
  var required = $(data[1]).text().trim().toLowerCase() == "true" || $(data[1]).text().trim().toLowerCase() == "yes";

  var param = {
    name: $(data[0]).text().trim(),
    required: required,
    requirements: $(data[2]).text().trim(),
    description: $(data[3]).text().trim(),
    class: required == true ? "required" : ""
  };

  return $.render.form_field_template(param);
}

$(function () {
  //using jsrender for templates https://github.com/BorisMoore/jsrender
  var form_field_template = '<tr><td>{{>name}}</td><td><input type="text" class="{{>class}}" name="{{>name}}" {{if required}} placeholder="required" {{/if}} </td><td>{{>requirements}}</td><td>{{>description}}</td></tr>';
  var cancel_button = '<button class="btn btn-danger cancel" id="cancel-{{>identifier}}">Cancel</button>';
  var tryit_button = '<button class="btn btn-success tryit" id="tryit-{{>identifier}}"><span class="icon-apiworkshop_v2"></span> Try It</button>';

  $.templates({
    form_field_template: form_field_template,
    cancel_button: cancel_button,
    tryit_button: tryit_button
  });

  $('.live-doc').each(function () {
    var livedoc = $(this);
    var form = $(this).find('form');
    var form_table = $(this).find('form>table');

    var id = $(this).attr('id');
    var identifier = id.substr(id.indexOf('-') + 1, id.length);

    var tryit_html = $.render.tryit_button({ identifier: identifier });
    var cancel_html = $.render.cancel_button({ identifier: identifier });
    livedoc.prevAll('.anchor-wrap').first().after(tryit_html + cancel_html);

    var params_table = $('#parameters-' + identifier);
    var rows = params_table.find('tr').slice(1); //throw out the header row

    var form_fields_html = "";
    rows.each(function () {
      form_fields_html += getParamHtml($(this).children('td'));
    });
    form_table.append(form_fields_html);

    if (rows.length == 0) {
      form_table.append('<tr><td colspan="4">No Parameters Needed</td></tr>');
    }

    form.append('<button type="input" class="btn btn-primary form-control">Make Request</button>');
  });

  $('.tryit').click(function () {
    var id = $(this).attr('id');
    var identifier = id.substr(id.indexOf('-') + 1, id.length);
    toggle_livedoc(identifier, true);
  });

  $('.cancel').click(function () {
    var id = $(this).attr('id');
    var identifier = id.substr(id.indexOf('-') + 1, id.length);
    toggle_livedoc(identifier, false);
  });

  $('.clear-request').click(function () {
    clear_results($(this).closest('.live-call'));
  });

  $('.live-doc form').submit(function (e) {
    e.preventDefault();

    //TODO validate that all required inputs have values

    //TODO check that the user has set username/password and json/xml response

    url = $(this).parent().find('.url').val();
    method = $(this).parent().find('.method').val().toUpperCase().trim();
    data = $(this).serialize().replace(/[^&]+=(?:&|$)/g, '').replace(/&$/, ''); //throw out empty params
    format = "json"; //TODO

    if (method == "GET") {
      call = url + "." + format + "?" + data
    } else {
      call = url + "." + format
    }

    live_call = $(this).nextAll('.live-call');
    live_call.find('.method').text(method);
    live_call.find('.call').text(call);

    if (method != "GET") {
      live_call.find('.request-data').removeClass("hidden");
      live_call.find('.data').text(decodeURIComponent(data));
    }

    live_call.find(".bar-indicator").show();
    live_call.show();

    $.ajax({
      type: method,
      url: url,
      data: data
    })
      .done(function (response, statusText, jqXHR) {
        live_call.find('.body').text(response);
        live_call.find('.response-body').removeClass('hidden');

        live_call.find('.headers').text(jqXHR.getAllResponseHeaders());
        live_call.find('.response-headers').removeClass('hidden');
      })
      .fail(function (response, statusText) {
        live_call.find('.body').text(statusText);
        live_call.find('.response-body').removeClass('hidden');
      })
      .always(function () {
        live_call.find(".bar-indicator").hide();
      });
  });
});
