(add-to-list 'load-path (expand-file-name "~/.emacs.d"))

;; keyboard for emacs running in OS X

(setq mac-command-modifier 'ctrl)

;; auto backup setting
(setq backup-by-copying nil)
1
(setq backup-directory-alist '(("." . "~/.emacs.bak")))
(require 'cursor-chg)

(change-cursor-mode 1)  ; Load this library
(toggle-cursor-type-when-idle 1) ; On for overwrite/read-only/input mode
(setq backup-by-copying nil) ; On when idle

;;; 允许与系统剪贴板进行复制粘贴
(setq x-select-enable-clipboard t)

;;; 显示左侧行号
(require 'linum)
(global-linum-mode)

;; 隐藏工具栏
(tool-bar-mode -1)

;; 通过菜单栏进行的界面定制，看起来还不错
(custom-set-variables
 ;; custom-set-variables was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 '(current-language-environment "Arabic")
 '(custom-enabled-themes (quote (tango-dark))))
(custom-set-faces
 ;; custom-set-faces was added by Custom.
 ;; If you edit it by hand, you could mess it up, so be careful.
 ;; Your init file should contain only one such instance.
 ;; If there is more than one, they won't work right.
 )

;;yasnippet
;(add-to-list 'load-path "~/.emacs.d/plugins/yasnippet")
;(require 'yasnippet)
;(yas/global-mode 1)

(setq default-major-mode 'text-mode)
(add-hook 'text-mode-hook 'turn-on-auto-fill)

(setq inhibit-startup-message t)
(setq kill-ring-max 200)
(setq scroll-margin 3
      scroll-conservatively 10000)
(show-paren-mode t)
(setq show-paren-style 'parentheses)
(auto-image-file-mode)
