(add-to-list 'load-path (expand-file-name "~/.emacs.d"))
(add-to-list 'load-path "~/.emacs.d/plugins/js2-mode")
(add-to-list 'load-path "~/.emacs.d/plugins/cursor-chg")
(add-to-list 'load-path "~/.emacs.d/plugins/yasnippet")
(add-to-list 'load-path "~/.emacs.d/plugins/ruby")

;; save edit status last time
(desktop-save-mode 1)
;; 没有提示音
(setq ring-bell-function 'ignore)

;; keyboard for emacs running in OS X
(setq mac-option-modifier 'meta)
(setq mac-command-modifier 'ctrl)

;; auto backup setting
(setq backup-by-copying nil)
(setq backup-directory-alist '(("." . "~/.emacs.bak")))

;(require 'cursor-chg)  ; Load this library
;(change-cursor-mode 1) ; On for overwrite/read-only/input mode
;(toggle-cursor-type-when-idle 1) ; On when idle

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
(require 'yasnippet)
(yas/global-mode 1)

(setq default-major-mode 'text-mode)
(add-hook 'text-mode-hook 'turn-on-auto-fill)

(setq inhibit-startup-message t)
(setq kill-ring-max 200)
(setq scroll-margin 3
      scroll-conservatively 10000)
(show-paren-mode t)
(setq show-paren-style 'parentheses)
(auto-image-file-mode)

(setq load-path (append (list (expand-file-name "~/.emacs.d/js2-mode")) load-path))
(autoload 'js2-mode "js2-mode" nil t)
(add-to-list 'auto-mode-alist '("\\.js$" . js2-mode))

;;格式化整个文件函数
(defun indent-whole ()
  (interactive)
  (indent-region (point-min) (point-max))
  (message "format successfully"))
;;绑定到F7键
(global-set-key [f11] 'indent-whole)

;; 各窗口间切换  
(global-set-key [M-left] 'windmove-left)
(global-set-key [M-right] 'windmove-right)  
(global-set-key [M-up] 'windmove-up)
(global-set-key [M-down] 'windmove-down)

;; 标题栏显示文件路径  
(setq frame-title-format  
      '("%S" (buffer-file-name "%f"  
			       (dired-directory dired-directory "%b"))))
;; 关闭鼠标加速  
(setq mouse-wheel-progressive-speed nil)
;; 平滑滚动屏幕  
(setq scroll-margin 3  
      scroll-conservatively 10000)  
;; 语法加亮  
(global-font-lock-mode t)

;;实现搜索选中文字
(defun wcy-define-key-in-transient-mode (global-p key cmd-mark-active  cmd-mark-no-active)
  (funcall (if global-p 'global-set-key 'local-set-key)
           key
           `(lambda ()
              (interactive)
              (if mark-active
                  (call-interactively ',cmd-mark-active)
                (call-interactively ',cmd-mark-no-active)))))

(defun wcy-isearch-forward-on-selection (&optional regexp-p no-recursive-edit)
  (interactive "P\np")
  (let ((text (buffer-substring (point) (mark))))
    (goto-char (min (point) (mark)))
    (setq mark-active nil)
    (isearch-mode t (not (null regexp-p)) nil (not no-recursive-edit))
    (isearch-process-search-string text text)))

(wcy-define-key-in-transient-mode t (kbd "C-s")
                                  'wcy-isearch-forward-on-selection
                                  'isearch-forward)

;;绑定全屏快捷键
(global-set-key [f12] 'ns-toggle-fullscreen)

;; set new method of kill a whole line 
(defadvice kill-ring-save (before slickcopy activate compile)
;;"When called interactively with no active region, copy a single line instead."
(interactive
 (if mark-active (list (region-beginning) (region-end))
   (list (line-beginning-position)
	 (line-beginning-position 2)))))

(defadvice kill-region (before slickcut activate compile)
  ;;"When called interactively with no active region, kill a single line instead."
  (interactive
   (if mark-active (list (region-beginning) (region-end))
     (list (line-beginning-position)
           (line-beginning-position 2)))))
