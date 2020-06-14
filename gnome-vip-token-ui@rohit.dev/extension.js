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
const Lang = imports.lang;
const OATHToolClient = CurrentExtension.imports.oathtool_client;
const Clipboard = St.Clipboard.get_default();
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;

var vipToken;

var VIPToken = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {
        _init() {
            this._lightColor = '#ccccccff';
            this._darkColor = '#474747ff';
            this._timeSpent = 0;
            this._time = 30;
            super._init(0, 'VIP Token');
            this.oathtool_client = new OATHToolClient.OATHToolClient();

            // this is adding icon
            let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box clipboard-indicator-hbox'});
            this.icon = new St.Icon({style_class: 'your-icon-name'});
            hbox.add_child(this.icon);
            this.add_child(hbox);
            this._buildMenu();

            this.menu.connect('open-state-changed', Lang.bind(this, (e) => {
                // when close stop and reset
                // log("LLL: open state changed event: " + e.isOpen);
                this._isOpen = e.isOpen;
                if (e.isOpen) {
                    // if open and not running start the stop watch
                    if (!this._running) {
                        this._startPause();
                    }
                }
            }));
        }

        _buildMenu() {
            let that = this;
            let displayMilliseconds = true;

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
            this._pie = new St.DrawingArea({reactive: false, style_class: 'pie-class'});
            this._pie.set_width(30);
            this._pie.set_height(25);
            this._pie.connect('repaint', Lang.bind(this, this._draw));
            box_Pie.add(this._pie, {y_align: St.Align.MIDDLE, y_fill: false});

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
            this._elapsedTime = new Date(0);

            this.vipToken = new St.Label({style_class: 'stopwatch-label'});
            box_vipToken.add(this.vipToken);
            this.vipToken.set_text("000000");
            this._stopwatch = new St.Label({style_class: 'stopwatch-label'});
            box.add(this._stopwatch);

            this.setDisplayMilliseconds(displayMilliseconds);

            Mainloop.timeout_add_seconds(1, Lang.bind(this, this._redrawStopwatch));

        }

        //Draw Pie
        _draw() {
            let [width, height] = this._pie.get_surface_size();
            let cr = this._pie.get_context();
            let xc = width / 2;
            let yc = height / 2;
            let pi = Math.PI;

            function arc(r, value, max, angle, lightColor, darkColor) {
                if (max === 0) return;
                let res;
                let light;
                let dark;
                [res, light] = Clutter.Color.from_string(lightColor);
                [res, dark] = Clutter.Color.from_string(darkColor);
                Clutter.cairo_set_source_color(cr, light);
                cr.arc(xc, yc, r, 0, 2 * pi);
                cr.fill();
                Clutter.cairo_set_source_color(cr, dark);
                let new_angle = angle + (value * 2 * pi / max);
                cr.setLineWidth(1.3);
                cr.arc(xc, yc, r, angle, new_angle);
                cr.lineTo(xc, yc);
                cr.closePath();
                cr.fill();
            }

            /*let background = new Clutter.Color();
            background.from_string('#0000ffff');
            Clutter.cairo_set_source_color(cr, background);
            cr.rectangle(0, 0, width, height);
            cr.fill();*/
            arc(8, this._timeSpent, this._time, -pi / 2, this._lightColor, this._darkColor);
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
        }

        _startPause() {
            if (this._running === true) {
                this._timeSpent = 0;
                this._elapsedTime = new Date(new Date().getTime() - this._startTime.getTime() + this._elapsedTime.getTime());
            } else {
                this._timeSpent = 0;
                this.oathtool_client.get((val) => {
                    this.vipToken.set_text(val[0]);
                    // copy it to clip board
                    Clipboard.set_text(CLIPBOARD_TYPE, val[0]);
                });
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
    if (!vipToken) {
        vipToken = new VIPToken();
        Main.panel.addToStatusArea('vip-token', vipToken, 1);
    }
}

function disable() {
    vipToken.destruct();
}
