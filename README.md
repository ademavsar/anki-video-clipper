# Anki Video Clipper

An Electron-based application for creating Anki cards while watching films.

## Features

- Video playback and subtitle display
- Dynamic subtitle listing and tracking
- Clip creation and editing
  - Include previous/next scenes
  - Adjust duration
  - Edit subtitle text
- Anki integration (via AnkiConnect API)
  - Send video clips directly to Anki
  - First/Last frame extraction to Anki media folder
  - Support for multiple note types and fields
- FFmpeg integration for video clip extraction
- Support for various subtitle formats (SRT, ASS, VTT)
- Smart embedded subtitle language detection with visual highlighting for special formats
- Modern tabbed UI for Anki card creation

## Screenshots

![Main Interface](screenshots/main_interface.png)
*Main interface with video player, subtitle list and clip editor*

![Anki Export](screenshots/anki_export.png)
*Anki export dialog for creating flashcards*

## Requirements

- [FFmpeg](https://ffmpeg.org/download.html) (must be installed on the system)
- [Anki](https://apps.ankiweb.net/) and [AnkiConnect](https://ankiweb.net/shared/info/2055492159) plugin

## AnkiConnect Configuration

To properly connect the application with Anki, make sure your AnkiConnect plugin is configured with the following settings:

```json
{
    "apiKey": null,
    "apiLogPath": null,
    "ignoreOriginList": [],
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": [
        "https://killergerbah.github.io",
        "http://localhost:3000",
        "file://",
        "chrome-extension://"
    ]
}
```

You can configure these settings by going to Anki → Tools → Add-ons → AnkiConnect → Config.

## Roadmap

- [x] Automatic subtitle tracking
- [x] Dynamic subtitle loading
- [x] Clip creation
- [x] FFmpeg integration
- [x] AnkiConnect integration
- [x] Smart embedded subtitle language detection with special format highlighting
- [x] UI/UX improvements
  - [x] Removed automatic DevTools opening on startup
  - [x] Added proper application menu with File, Edit, View and Help options
  - [x] Tabbed interface for Anki card creation with Media, Content, and Settings tabs
- [x] Enhanced subtitle settings and customization
  - [x] Font family selection (Arial, Verdana, Roboto, Open Sans, Noto Sans, Courier New, Times New Roman)
  - [x] Text formatting options (bold, italic)
  - [x] Advanced vertical positioning with custom percentage values
  - [x] Improved UI with dark theme compatible controls
- [x] First/Last frame capture feature for Anki cards
- [x] Dynamic note type field support
- [ ] Better compatibility with various video codecs
- [ ] Drag and drop support for video and subtitle files
- [ ] Advanced subtitle search and filtering
- [ ] Third-party player integration (VLC, MPC-HC, etc.)
- [ ] Keyboard shortcuts
- [ ] Settings page

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.