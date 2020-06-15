# gnome-vip-token-ui

UI to show one time password for vip token and time left for its expiry

## INSTALLATION
* Copy whole of gnome-vip-token-ui@rohit.dev to ~/.local/share/gnome-shell/extensions
* gsettings set org.gnome.shell disable-user-extensions false
* Run gsettings get org.gnome.shell enabled-extensions
  * Output: ['locate-search-provider@rohit.dev']
* Add 'gnome-vip-toen-ui@rohit.dev' to the list from above and run
  * gsettings set org.gnome.shell enabled-extensions ['gnome-vip-token-ui@rohit.dev', 'locate-search-provider@rohit.dev']
