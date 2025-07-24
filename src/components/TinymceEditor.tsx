import { Spin } from "antd";
import { Editor } from "@tinymce/tinymce-react";
import { useState } from "react";
import { getLocale, useIntl } from "@umijs/max";

import { uploadImgData } from "@/services/project";
import { getPublicPath } from "@/utils/env";
import { LanguageConfigMap } from "@/types/common";

interface Props {
  value?: string;
  height?: number;
  imageApi?: string;
  formData?: Record<string, any>;
  emailVariableMenuVisible?: boolean;
  onChange?: (v: string) => void;
}

function TinymceEditor({
  value,
  onChange,
  imageApi,
  formData,
  height = 400,
  emailVariableMenuVisible = false,
}: Props) {
  const [loading, setLoading] = useState(true);
  const { formatMessage } = useIntl();
  const language = LanguageConfigMap.get(getLocale()).editorLang || "en";
  const menu: Record<string, any> = {
    tc: {
      title: "Comments",
      items: "addcomment showcomments deleteallconversations",
    },
  };

  if (emailVariableMenuVisible) {
    menu.custom = {
      title: formatMessage({ id: "email.variable" }),
      items: formatMessage({ id: "email.variable.user-name" }),
    };
  }

  const editorChange = (v: string) => {
    if (onChange) {
      onChange(v);
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ height }}>
        <Editor
          tinymceScriptSrc={`${getPublicPath()}/lib/editor/tinymce.min.js`}
          apiKey="wkf6fajolq0yyjcrhc4y1y5xnft5nsq4c9cq3m77mc93p319"
          // initialValue={value}
          key={language}
          value={value}
          init={{
            language,
            plugins:
              "preview importcss searchreplace autolink autosave visualblocks visualchars fullscreen image link " +
              "table charmap hr nonbreaking toc insertdatetime advlist lists wordcount " +
              "imagetools textpattern noneditable help charmap",
            // tinydrive_token_provider: 'URL_TO_YOUR_TOKEN_PROVIDER',
            // tinydrive_dropbox_app_key: 'YOUR_DROPBOX_APP_KEY',
            // tinydrive_google_drive_key: 'YOUR_GOOGLE_DRIVE_KEY',
            // tinydrive_google_drive_client_id: 'YOUR_GOOGLE_DRIVE_CLIENT_ID',
            // mobile: {
            //   plugins:
            //     'print preview powerpaste casechange importcss tinydrive searchreplace autolink autosave save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount tinymcespellchecker a11ychecker textpattern noneditable help formatpainter pageembed charmap mentions quickbars linkchecker emoticons advtable',
            // },
            // images_upload_url: imageApi,
            images_replace_blob_uris: true,
            paste_data_images: true,
            images_upload_handler(blobInfo, success) {
              uploadImgData(blobInfo, imageApi, formData).then((resp) => {
                success(resp.data);
              });
            },
            menu,
            setup(editor) {
              if (emailVariableMenuVisible) {
                editor.ui.registry.addMenuItem(
                  formatMessage({ id: "email.variable.user-name" }),
                  {
                    text: formatMessage({ id: "email.variable.user-name" }),
                    onAction() {
                      editor.insertContent("{{user_name}}");
                    },
                  }
                );
              }
            },
            menubar: "custom file edit view insert format tools table tc help",
            toolbar:
              "undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media pageembed template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment",
            autosave_ask_before_unload: true,
            autosave_interval: "30s",
            autosave_prefix: "{path}{query}-{id}-",
            autosave_restore_when_empty: false,
            autosave_retention: "2m",
            image_advtab: true,
            link_list: [],
            image_list: [],
            image_class_list: [
              { title: "None", value: "" },
              { title: "Some class", value: "class-name" },
            ],
            importcss_append: true,
            templates: [
              {
                title: "New Table",
                description: "creates a new table",
                content:
                  '<div class="mceTmpl"><table width="98%%"  border="0" cellspacing="0" cellpadding="0"><tr><th scope="col"> </th><th scope="col"> </th></tr><tr><td> </td><td> </td></tr></table></div>',
              },
              {
                title: "Starting my story",
                description: "A cure for writers block",
                content: "Once upon a time...",
              },
              {
                title: "New list with dates",
                description: "New List with dates",
                content:
                  '<div class="mceTmpl"><span class="cdate">cdate</span><br /><span class="mdate">mdate</span><h2>My List</h2><ul><li></li><li></li></ul></div>',
              },
            ],
            template_cdate_format:
              "[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]",
            template_mdate_format:
              "[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]",
            height,
            image_caption: true,
            quickbars_selection_toolbar:
              "bold italic | quicklink h2 h3 blockquote quickimage quicktable",
            noneditable_noneditable_class: "mceNonEditable",
            toolbar_mode: "sliding",
            spellchecker_ignore_list: ["Ephox", "Moxiecode"],
            tinycomments_mode: "embedded",
            content_style: ".mymention{ color: gray; }",
            contextmenu: "link image imagetools table configurepermanentpen",
            a11y_advanced_options: true,
            // skin: useDarkMode ? 'oxide-dark' : 'oxide',
            // content_css: useDarkMode ? 'dark' : 'default',
            /*
            The following settings require more configuration than shown here.
            For information on configuring the mentions plugin, see:
            https://www.tiny.cloud/docs/plugins/premium/mentions/.
            */
            mentions_selector: ".mymention",
            // mentions_fetch: mentions_fetch,
            // mentions_menu_hover: mentions_menu_hover,
            // mentions_menu_complete: mentions_menu_complete,
            // mentions_select: mentions_select,
            mentions_item_type: "profile",
            branding: false,
          }}
          // onChange={editorChange}
          onEditorChange={editorChange}
          scriptLoading={{
            async: true,
          }}
          onInit={() => {
            setLoading(false);
          }}
          onPaste={(v, editor) => {
            setTimeout(() => {
              editor.editorUpload.uploadImages();
            }, 0);
          }}
        />
      </div>
    </Spin>
  );
}

export default TinymceEditor;
