/*
 * Copyright (C) 2012  Domen Vrankar  <domen gamabit com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
 * USA.
 */

const Main = imports.ui.main;

const CurrentExtension = imports.misc.extensionUtils.getCurrentExtension();
const GObject = imports.gi.GObject;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const OATHToolClient = CurrentExtension.imports.oathtool_client;
const Clipboard = St.Clipboard.get_default();
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;


var stopwatch;

var myPopup;

var MyPopup = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {
        _getCustIcon() {
            // let file = Gio.icon_new_for_string( CurrentExtension.dir.get_child('icons').get_path() + "/icon/viptoken.svg" );
            let file = Gio.file_new_for_path( CurrentExtension.dir.get_child('icons').get_path() + "/icon/viptoken.svg" );
            let icon_uri = file.get_uri();

            return St.TextureCache.get_default().load_uri_async(icon_uri, 64, 64);
        }

        _init() {
            this._lightColor = '#ccccccff';
            this._darkColor = '#474747ff';
            this._timeSpent = 0;
            this._time = 30;
            super._init(0, 'VIP Token');
            this.oathtool_client = new OATHToolClient.OATHToolClient();
            this.label = "New Menut item";

            // this is adding icon
            let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box clipboard-indicator-hbox'});
            // this.icon = new St.Icon({
            //     icon_name: INDICATOR_ICON,
            //     style_class: 'system-status-icon clipboard-indicator-icon'
            // });
            this.icon = new St.Icon({style_class: 'your-icon-name'});
            hbox.add_child(this.icon);
            // this is adding text
            // this._buttonText = new St.Label({
            //     text: _('Text will be here'),
            //     y_align: Clutter.ActorAlign.CENTER
            // });
            // hbox.add_child(this._buttonText);
            // hbox.add(PopupMenu.arrowIcon(St.Side.BOTTOM));
            this.add_child(hbox);
            this._buildMenu();

            // this.actor.connect('button-press-event', Lang.bind(this, (e) => {
            //     log("LLL: button press event" + e);
            // }));
            this.menu.connect('open-state-changed', Lang.bind(this, (e) => {
                // when close stop and reset
                // log("LLL: open state changed event: " + e.isOpen);
                this._isOpen = e.isOpen;
                if (e.isOpen) {
                    // if open and not running start the stop watch
                    if (!this._running){
                        this._startPause();
                    }
                }
            }));
        }
        _buildMenu() {
            let that = this;
            let displayMilliseconds = true;

            // Add 'Clear' button which removes all items from cache
            // let clearMenuItem = new PopupMenu.PopupMenuItem(_('Clear history'));
            // that.menu.addMenuItem(clearMenuItem);
            // clearMenuItem.connect('activate', Lang.bind(that, () => {
            //     log("LLL: activate 1")
            // }));
            let box = new St.BoxLayout();
            let box_vipToken = new St.BoxLayout();
            let box_Pie = new St.BoxLayout();

            // stop watch display
            let boxPieEntryItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false
            });

            let boxEntryItem2 = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false
            });
            //Set Pie
            this._pie = new St.DrawingArea({ reactive: false});
            this._pie.set_width(30);
            this._pie.set_height(25);
            this._pie.connect('repaint', Lang.bind(this, this._draw));
            box_Pie.add(this._pie, { y_align: St.Align.MIDDLE, y_fill: false });

            boxEntryItem2.actor.add(box_vipToken, {expand: true});
            boxPieEntryItem.actor.add(box_Pie, {expand: true});

            that.menu.addMenuItem(boxEntryItem2);
            that.menu.addMenuItem(boxPieEntryItem);

            // stop watch display
            let boxEntryItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false
            });

            boxEntryItem.actor.add(box, {expand: true});

            that.menu.addMenuItem(boxEntryItem);

            this._running = false;
            this._startTime = false;
            this._elapsedTime = new Date( 0 );

            this.vipToken = new St.Label( { style_class: 'stopwatch-label' } );
            box_vipToken.add( this.vipToken );
            this.vipToken.set_text("000000");
            this._stopwatch = new St.Label( { style_class: 'stopwatch-label' } );
            box.add( this._stopwatch );

            this.setDisplayMilliseconds(displayMilliseconds);

            // add start/pause button
            // this._startPauseButton = new St.Button( { style_class: 'stopwatch-button', reactive: true } );
            //
            // this._startIcon = new St.Icon( { icon_name: 'media-playback-start-symbolic', style_class: 'stopwatch-button-icon' } );
            // this._pauseIcon = new St.Icon( { icon_name: 'media-playback-pause-symbolic', style_class: 'stopwatch-button-icon' } );
            //
            // this._startPauseButton.set_child( this._startIcon );
            // this._startPauseButtonConnection = this._startPauseButton.connect( 'button-press-event', Lang.bind( this, this._startPause ) );
            // box.add( this._wrapButtonIntoBin( this._startPauseButton ) );

            // add restart button
            // this._restartButton = new St.Button( { style_class: 'stopwatch-button' } );
            //
            // this._restartButton.set_child( new St.Icon( { icon_name: 'view-refresh-symbolic', style_class: 'stopwatch-button-icon' } ) );
            // this._restartButtonConnection = this._restartButton.connect( 'button-press-event', Lang.bind( this, this._restartStopwatch ) );
            // box.add( this._wrapButtonIntoBin( this._restartButton ) );

            Mainloop.timeout_add_seconds( 1, Lang.bind( this, this._redrawStopwatch ) );

            /* This create the search entry, which is add to a menuItem.
            The searchEntry is connected to the function for research.
            The menu itself is connected to some shitty hack in order to
            grab the focus of the keyboard. */
            // that._entryItem = new PopupMenu.PopupBaseMenuItem({
            //     reactive: false,
            //     can_focus: false
            // });
            // that.searchEntry = new St.Entry({
            //     name: 'searchEntry',
            //     style_class: 'search-entry',
            //     can_focus: true,
            //     hint_text: _('Type here to search...'),
            //     track_hover: true
            // });
            //
            // that.searchEntry.get_clutter_text().connect(
            //     'text-changed',
            //     Lang.bind(that, () => {
            //         log("LLL search text changed")
            //     })
            // );
            //
            // that._entryItem.actor.add(that.searchEntry, {expand: true});
            //
            // that.menu.addMenuItem(that._entryItem);
            //
            // that.menu.connect('open-state-changed', Lang.bind(this, function (self, open) {
            //     let a = Mainloop.timeout_add(50, Lang.bind(this, function () {
            //         if (open) {
            //             that.searchEntry.set_text('');
            //             global.stage.set_key_focus(that.searchEntry);
            //         }
            //         Mainloop.source_remove(a);
            //     }));
            // }));
            //
            // // Create menu sections for items
            // // Favorites
            // that.favoritesSection = new PopupMenu.PopupMenuSection();
            //
            // that.scrollViewFavoritesMenuSection = new PopupMenu.PopupMenuSection();
            // let favoritesScrollView = new St.ScrollView({
            //     style_class: 'ci-history-menu-section',
            //     overlay_scrollbars: true
            // });
            // favoritesScrollView.add_actor(that.favoritesSection.actor);
            //
            // that.scrollViewFavoritesMenuSection.actor.add_actor(favoritesScrollView);
            // that.menu.addMenuItem(that.scrollViewFavoritesMenuSection);
            // that.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            //
            // // History
            // that.historySection = new PopupMenu.PopupMenuSection();
            //
            // that.scrollViewMenuSection = new PopupMenu.PopupMenuSection();
            // let historyScrollView = new St.ScrollView({
            //     style_class: 'ci-history-menu-section',
            //     overlay_scrollbars: true
            // });
            // historyScrollView.add_actor(that.historySection.actor);
            //
            // that.scrollViewMenuSection.actor.add_actor(historyScrollView);
            //
            // that.menu.addMenuItem(that.scrollViewMenuSection);
            //
            // // Add separator
            // that.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            //
            // // Private mode switch
            // that.privateModeMenuItem = new PopupMenu.PopupSwitchMenuItem(
            //     _("Private mode"), PRIVATEMODE, {reactive: true});
            // that.privateModeMenuItem.connect('toggled',
            //     Lang.bind(that, () => {
            //         log("LLL: Toggled")
            //     }));
            // that.menu.addMenuItem(that.privateModeMenuItem);
            // // that._onPrivateModeSwitch();
            //
            // // Add 'Clear' button which removes all items from cache
            // let clearMenuItem = new PopupMenu.PopupMenuItem(_('Clear history'));
            // that.menu.addMenuItem(clearMenuItem);
            // clearMenuItem.connect('activate', Lang.bind(that, () => {
            //     log("LLL: activate 1")
            // }));
            //
            // // Add 'Settings' menu item to open settings
            // let settingsMenuItem = new PopupMenu.PopupMenuItem(_('Settings'));
            // that.menu.addMenuItem(settingsMenuItem);
            // settingsMenuItem.connect('activate', Lang.bind(that, () => {
            //     log("LLL: activate")
            // }));

        }

        //Draw Pie
        _draw() {
            let [width, height] = this._pie.get_surface_size();
            let cr = this._pie.get_context();
            let xc = width / 2;
            let yc = height / 2;
            let pi = Math.PI;
            function arc(r, value, max, angle, lightColor, darkColor) {
                if(max == 0) return;
                let res;
                let light;
                let dark;
                [res, light] = Clutter.Color.from_string(lightColor);
                [res, dark] = Clutter.Color.from_string(darkColor);
                Clutter.cairo_set_source_color(cr, light);
                cr.arc(xc, yc, r, 0, 2*pi);
                cr.fill();
                Clutter.cairo_set_source_color(cr, dark);
                let new_angle = angle + (value * 2 * pi / max);
                cr.setLineWidth(1.3);
                cr.arc(xc, yc, r, angle, new_angle);
                cr.lineTo(xc,yc);
                cr.closePath();
                cr.fill();
            }
            /*let background = new Clutter.Color();
            background.from_string('#0000ffff');
            Clutter.cairo_set_source_color(cr, background);
            cr.rectangle(0, 0, width, height);
            cr.fill();*/
            arc(8,this._timeSpent,this._time,-pi/2, this._lightColor, this._darkColor);
        }


        setDisplayMilliseconds(display) {
            this._displayMilliseconds = display;
            this._stopwatchStartTimeLabel = '0:00:00';

            if (display) {
                this._stopwatchStartTimeLabel += '.000';
            }

            if (!this._running) {
                this._stopwatch.set_text(this._stopwatchStartTimeLabel);
            }
        }

        destruct() {
            log("LLL: destruct");
            // close menu and hide stopwatch
            this.menu.close();
            // this.container.hide();

            // this._startPauseButton.disconnect(this._startPauseButtonConnection);
            // this._restartButton.disconnect(this._restartButtonConnection);
        }

        _wrapButtonIntoBin(button) {
            let buttonBin = new St.Bin({style_class: 'stopwatch-bin'});
            buttonBin.set_child(button);

            return buttonBin;
        }

        _startPause() {
            if (this._running === true) {
                this._timeSpent = 0;
                // this._startPauseButton.set_child(this._startIcon);
                this._elapsedTime = new Date(new Date().getTime() - this._startTime.getTime() + this._elapsedTime.getTime());
            } else {
                this._timeSpent = 0;
                this.oathtool_client.get((val) => {
                    this.vipToken.set_text(val[0]);
                    // copy it to clip board
                    Clipboard.set_text(CLIPBOARD_TYPE, val[0]);
                });
                // this._startPauseButton.set_child(this._pauseIcon);
                this._startTime = new Date();
            }

            this._running = !this._running;
        }

        _restartStopwatch() {
            this._elapsedTime = new Date(0);
            this._timeSpent = 0;
            this._startTime = false;
            this._running = false;
            this._stopwatch.set_text(this._stopwatchStartTimeLabel);
            // this._startPauseButton.set_child(this._startIcon);
        }

        _redrawStopwatch() {
            if (this._startTime) {
                if (this._running === true) {
                    let renderTime = new Date(new Date().getTime() - this._startTime.getTime() + this._elapsedTime.getTime());
                    let text = String(~~(renderTime.getTime() / 3600000)) + ':' + renderTime.toLocaleFormat('%M:%S');

                    if (this._displayMilliseconds) {
                        text += '.' + this._formatMilliseconds(renderTime.getMilliseconds());
                    }

                    this._timeSpent += 1;
                    if (this._timeSpent === 31) {
                        if (this._isOpen) {
                            // if open restart
                            this._restartStopwatch();
                        } else {
                            // stop the stop watch
                            this._startPause()
                            this._restartStopwatch();
                        }
                    }
                    this._pie.queue_repaint();
                    this._stopwatch.set_text(text);
                }
            } else {
                this._stopwatch.set_text(this._stopwatchStartTimeLabel);
            }

            return true;
        }

        _formatMilliseconds(num) {
            let r = num.toString();

            while (r.length < 3) {
                r = '0' + r;
            }

            return r;
        }
    }
);

function init() {
}

function enable() {
    if (!myPopup) {
        myPopup = new MyPopup();
        Main.panel.addToStatusArea('vip-token', myPopup, 1);
    }
}

function disable() {
    myPopup.destruct();
}
