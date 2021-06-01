---
layout: post
title: gcc5.4.0 shared_ptr源码阅读--引用计数
date: 2020-07-15
tags: 博客
---

## 引言
本文探究在gcc5.4.0中，shared_ptr引用计数的实现

相关源码：

来源：Ubuntu 16

路径：/usr/include/c++/5.4.0/bits

文件：shared_ptr_atomic.h  shared_ptr_base.h  shared_ptr.h

 

## shared_ptr类
下面是我精简的shared_ptr类代码，完整的在文末

```
template <typename _Tp>
  class shared_ptr : public __shared_ptr<_Tp>
  {

  public:
    /**
       *  @brief  Construct an empty %shared_ptr.
       *  @post   use_count()==0 && get()==0
       */
    constexpr shared_ptr() noexcept
        : __shared_ptr<_Tp>() {}

    shared_ptr(const shared_ptr &) noexcept = default;

    /**
       *  @brief  Construct a %shared_ptr that owns the pointer @a __p.
       *  @param  __p  A pointer that is convertible to element_type*.
       *  @post   use_count() == 1 && get() == __p
       *  @throw  std::bad_alloc, in which case @c delete @a __p is called.
       */
    template <typename _Tp1>
    explicit shared_ptr(_Tp1 *__p)
        : __shared_ptr<_Tp>(__p) {}

    /**
       *  @brief  Move-constructs a %shared_ptr instance from @a __r.
       *  @param  __r  A %shared_ptr rvalue.
       *  @post   *this contains the old value of @a __r, @a __r is empty.
       */
    shared_ptr(shared_ptr &&__r) noexcept
        : __shared_ptr<_Tp>(std::move(__r)) {}

    /**
       *  @brief  Constructs a %shared_ptr that shares ownership with @a __r
       *          and stores a copy of the pointer stored in @a __r.
       *  @param  __r  A weak_ptr.
       *  @post   use_count() == __r.use_count()
       *  @throw  bad_weak_ptr when __r.expired(),
       *          in which case the constructor has no effect.
       */
    template <typename _Tp1>
    explicit shared_ptr(const weak_ptr<_Tp1> &__r)
        : __shared_ptr<_Tp>(__r) {}

  private:

    template <typename _Tp1, typename _Alloc, typename... _Args>
    friend shared_ptr<_Tp1>
    allocate_shared(const _Alloc &__a, _Args &&... __args);

    // This constructor is non-standard, it is used by weak_ptr::lock().
    shared_ptr(const weak_ptr<_Tp> &__r, std::nothrow_t)
        : __shared_ptr<_Tp>(__r, std::nothrow) {}

    friend class weak_ptr<_Tp>;
  };
```

可以看出来，shared_ptr只是个包装__shared_ptr的类，具体实现需要去看__shared_ptr。除了构造函数和拷贝构造函数，该类还提供了移动语义。

顺带一提，用原始指针初始化shared_ptr在effective modern c++中是不推荐的。原始指针的操作不受引用计数约束，为降低直接释放原始指针所指资源的风险，尽量用make_shared初始化是比较好的风格。

下面是__shared_ptr精简后的源码

 ```
 template <typename _Tp, _Lock_policy _Lp>
  class __shared_ptr
      : public __shared_ptr_access<_Tp, _Lp>
  {
  public:
    using element_type = typename remove_extent<_Tp>::type;

  private:

    template <typename _Deleter>
    __shared_ptr(nullptr_t __p, _Deleter __d)
        : _M_ptr(0), _M_refcount(__p, std::move(__d))
    {
    }

    __shared_ptr(__shared_ptr &&__r) noexcept
        : _M_ptr(__r._M_ptr), _M_refcount()
    {
      _M_refcount._M_swap(__r._M_refcount);
      __r._M_ptr = 0;
    }


  private:

    element_type *_M_ptr;            // Contained pointer.
    __shared_count<_Lp> _M_refcount; // Reference counter.
  };
```
可以看出，引用计数是__shared_count类型。继续看下该类源码，引用计数的底层类型是_Sp_counted_base<_Lp> *

 ```
 template <_Lock_policy _Lp>
  class __shared_count
  {
  public:
    constexpr __shared_count() noexcept : _M_pi(0)
    {
    }

    template <typename _Ptr>
    explicit __shared_count(_Ptr __p) : _M_pi(0)
    {
      __try
      {
        _M_pi = new _Sp_counted_ptr<_Ptr, _Lp>(__p);
      }
      __catch(...)
      {
        delete __p;
        __throw_exception_again;
      }
    }

  private:
    friend class __weak_count<_Lp>;

    _Sp_counted_base<_Lp> *_M_pi;
  };
```

## _Sp_counted_base类
经过上文分析，我们终于找到了use_count的底层实现类。下面我们来看下这个类

```
template <_Lock_policy _Lp = __default_lock_policy>
  class _Sp_counted_base
      : public _Mutex_base<_Lp>
  {
  public:
    _Sp_counted_base() noexcept
        : _M_use_count(1), _M_weak_count(1) {}

    virtual ~_Sp_counted_base() noexcept
    {
    }

    // Called when _M_use_count drops to zero, to release the resources
    // managed by *this.
    // pusidun注 这里是纯虚函数，必须实现对象的析构。具体的析构需要看下__shared_ptr那里
    virtual void
    _M_dispose() noexcept = 0;

    // Called when _M_weak_count drops to zero.
    virtual void
    _M_destroy() noexcept
    {
      delete this;
    }

    virtual void *
    _M_get_deleter(const std::type_info &) noexcept = 0;

    void
    _M_add_ref_copy()
    {
      __gnu_cxx::__atomic_add_dispatch(&_M_use_count, 1);
    }

    void
    _M_add_ref_lock();

    bool
    _M_add_ref_lock_nothrow();

    void
    _M_release() noexcept
    {
      // Be race-detector-friendly.  For more info see bits/c++config.
      _GLIBCXX_SYNCHRONIZATION_HAPPENS_BEFORE(&_M_use_count);
      // pusidun注 这里是原子操作,先_M_use_count-1，然后检查_M_use_count减掉1之前是否是1
      // 是1说明现在引用计数已经降为0了，调用_M_dispose析构掉持有对象
      if (__gnu_cxx::__exchange_and_add_dispatch(&_M_use_count, -1) == 1)
      {
        _GLIBCXX_SYNCHRONIZATION_HAPPENS_AFTER(&_M_use_count);
        _M_dispose();
        // There must be a memory barrier between dispose() and destroy()
        // to ensure that the effects of dispose() are observed in the
        // thread that runs destroy().
        // See http://gcc.gnu.org/ml/libstdc++/2005-11/msg00136.html
        if (_Mutex_base<_Lp>::_S_need_barriers)
        {
          __atomic_thread_fence(__ATOMIC_ACQ_REL);
        }

        // Be race-detector-friendly.  For more info see bits/c++config.
        _GLIBCXX_SYNCHRONIZATION_HAPPENS_BEFORE(&_M_weak_count);
        if (__gnu_cxx::__exchange_and_add_dispatch(&_M_weak_count,
                                                   -1) == 1)
        {
          _GLIBCXX_SYNCHRONIZATION_HAPPENS_AFTER(&_M_weak_count);
          _M_destroy();
        }
      }
    }

    void
    _M_weak_add_ref() noexcept
    {
      __gnu_cxx::__atomic_add_dispatch(&_M_weak_count, 1);
    }

    void
    _M_weak_release() noexcept
    {
      // Be race-detector-friendly. For more info see bits/c++config.
      _GLIBCXX_SYNCHRONIZATION_HAPPENS_BEFORE(&_M_weak_count);
      if (__gnu_cxx::__exchange_and_add_dispatch(&_M_weak_count, -1) == 1)
      {
        _GLIBCXX_SYNCHRONIZATION_HAPPENS_AFTER(&_M_weak_count);
        if (_Mutex_base<_Lp>::_S_need_barriers)
        {
          // See _M_release(),
          // destroy() must observe results of dispose()
          __atomic_thread_fence(__ATOMIC_ACQ_REL);
        }
        _M_destroy();
      }
    }

    long
    _M_get_use_count() const noexcept
    {
      // No memory barrier is used here so there is no synchronization
      // with other threads.
      return __atomic_load_n(&_M_use_count, __ATOMIC_RELAXED);
    }

  private:
    _Sp_counted_base(_Sp_counted_base const &) = delete;
    _Sp_counted_base &operator=(_Sp_counted_base const &) = delete;

    _Atomic_word _M_use_count;  // #shared
    _Atomic_word _M_weak_count; // #weak + (#shared != 0)
  };
```

重点是42行的_M_release() 方法。

该方法中，对use_count进行增减、比较是原子操作。这就说明，在多线程中，shared_ptr的引用计数本身是线程安全的。但是，_M_dispose()的线程安全性却无法得到保证（并没有同步措施处理data race情况）。也就是说，shared_ptr管理的内存，在多线程环境下需要关注析构细节。

## 附文中详细源码

shared_ptr类源码
```
1   template <typename _Tp>
  2   class shared_ptr : public __shared_ptr<_Tp>
  3   {
  4     template <typename _Ptr>
  5     using _Convertible = typename enable_if<is_convertible<_Ptr, _Tp *>::value>::type;
  6 
  7   public:
  8     /**
  9        *  @brief  Construct an empty %shared_ptr.
 10        *  @post   use_count()==0 && get()==0
 11        */
 12     constexpr shared_ptr() noexcept
 13         : __shared_ptr<_Tp>() {}
 14 
 15     shared_ptr(const shared_ptr &) noexcept = default;
 16 
 17     /**
 18        *  @brief  Construct a %shared_ptr that owns the pointer @a __p.
 19        *  @param  __p  A pointer that is convertible to element_type*.
 20        *  @post   use_count() == 1 && get() == __p
 21        *  @throw  std::bad_alloc, in which case @c delete @a __p is called.
 22        */
 23     template <typename _Tp1>
 24     explicit shared_ptr(_Tp1 *__p)
 25         : __shared_ptr<_Tp>(__p) {}
 26 
 27     /**
 28        *  @brief  Construct a %shared_ptr that owns the pointer @a __p
 29        *          and the deleter @a __d.
 30        *  @param  __p  A pointer.
 31        *  @param  __d  A deleter.
 32        *  @post   use_count() == 1 && get() == __p
 33        *  @throw  std::bad_alloc, in which case @a __d(__p) is called.
 34        *
 35        *  Requirements: _Deleter's copy constructor and destructor must
 36        *  not throw
 37        *
 38        *  __shared_ptr will release __p by calling __d(__p)
 39        */
 40     template <typename _Tp1, typename _Deleter>
 41     shared_ptr(_Tp1 *__p, _Deleter __d)
 42         : __shared_ptr<_Tp>(__p, __d) {}
 43 
 44     /**
 45        *  @brief  Construct a %shared_ptr that owns a null pointer
 46        *          and the deleter @a __d.
 47        *  @param  __p  A null pointer constant.
 48        *  @param  __d  A deleter.
 49        *  @post   use_count() == 1 && get() == __p
 50        *  @throw  std::bad_alloc, in which case @a __d(__p) is called.
 51        *
 52        *  Requirements: _Deleter's copy constructor and destructor must
 53        *  not throw
 54        *
 55        *  The last owner will call __d(__p)
 56        */
 57     template <typename _Deleter>
 58     shared_ptr(nullptr_t __p, _Deleter __d)
 59         : __shared_ptr<_Tp>(__p, __d) {}
 60 
 61     /**
 62        *  @brief  Construct a %shared_ptr that owns the pointer @a __p
 63        *          and the deleter @a __d.
 64        *  @param  __p  A pointer.
 65        *  @param  __d  A deleter.
 66        *  @param  __a  An allocator.
 67        *  @post   use_count() == 1 && get() == __p
 68        *  @throw  std::bad_alloc, in which case @a __d(__p) is called.
 69        *
 70        *  Requirements: _Deleter's copy constructor and destructor must
 71        *  not throw _Alloc's copy constructor and destructor must not
 72        *  throw.
 73        *
 74        *  __shared_ptr will release __p by calling __d(__p)
 75        */
 76     template <typename _Tp1, typename _Deleter, typename _Alloc>
 77     shared_ptr(_Tp1 *__p, _Deleter __d, _Alloc __a)
 78         : __shared_ptr<_Tp>(__p, __d, std::move(__a)) {}
 79 
 80     /**
 81        *  @brief  Construct a %shared_ptr that owns a null pointer
 82        *          and the deleter @a __d.
 83        *  @param  __p  A null pointer constant.
 84        *  @param  __d  A deleter.
 85        *  @param  __a  An allocator.
 86        *  @post   use_count() == 1 && get() == __p
 87        *  @throw  std::bad_alloc, in which case @a __d(__p) is called.
 88        *
 89        *  Requirements: _Deleter's copy constructor and destructor must
 90        *  not throw _Alloc's copy constructor and destructor must not
 91        *  throw.
 92        *
 93        *  The last owner will call __d(__p)
 94        */
 95     template <typename _Deleter, typename _Alloc>
 96     shared_ptr(nullptr_t __p, _Deleter __d, _Alloc __a)
 97         : __shared_ptr<_Tp>(__p, __d, std::move(__a)) {}
 98 
 99     // Aliasing constructor
100 
101     /**
102        *  @brief  Constructs a %shared_ptr instance that stores @a __p
103        *          and shares ownership with @a __r.
104        *  @param  __r  A %shared_ptr.
105        *  @param  __p  A pointer that will remain valid while @a *__r is valid.
106        *  @post   get() == __p && use_count() == __r.use_count()
107        *
108        *  This can be used to construct a @c shared_ptr to a sub-object
109        *  of an object managed by an existing @c shared_ptr.
110        *
111        * @code
112        * shared_ptr< pair<int,int> > pii(new pair<int,int>());
113        * shared_ptr<int> pi(pii, &pii->first);
114        * assert(pii.use_count() == 2);
115        * @endcode
116        */
117     template <typename _Tp1>
118     shared_ptr(const shared_ptr<_Tp1> &__r, _Tp *__p) noexcept
119         : __shared_ptr<_Tp>(__r, __p) {}
120 
121     /**
122        *  @brief  If @a __r is empty, constructs an empty %shared_ptr;
123        *          otherwise construct a %shared_ptr that shares ownership
124        *          with @a __r.
125        *  @param  __r  A %shared_ptr.
126        *  @post   get() == __r.get() && use_count() == __r.use_count()
127        */
128     template <typename _Tp1, typename = _Convertible<_Tp1 *>>
129     shared_ptr(const shared_ptr<_Tp1> &__r) noexcept
130         : __shared_ptr<_Tp>(__r) {}
131 
132     /**
133        *  @brief  Move-constructs a %shared_ptr instance from @a __r.
134        *  @param  __r  A %shared_ptr rvalue.
135        *  @post   *this contains the old value of @a __r, @a __r is empty.
136        */
137     shared_ptr(shared_ptr &&__r) noexcept
138         : __shared_ptr<_Tp>(std::move(__r)) {}
139 
140     /**
141        *  @brief  Move-constructs a %shared_ptr instance from @a __r.
142        *  @param  __r  A %shared_ptr rvalue.
143        *  @post   *this contains the old value of @a __r, @a __r is empty.
144        */
145     template <typename _Tp1, typename = _Convertible<_Tp1 *>>
146     shared_ptr(shared_ptr<_Tp1> &&__r) noexcept
147         : __shared_ptr<_Tp>(std::move(__r)) {}
148 
149     /**
150        *  @brief  Constructs a %shared_ptr that shares ownership with @a __r
151        *          and stores a copy of the pointer stored in @a __r.
152        *  @param  __r  A weak_ptr.
153        *  @post   use_count() == __r.use_count()
154        *  @throw  bad_weak_ptr when __r.expired(),
155        *          in which case the constructor has no effect.
156        */
157     template <typename _Tp1>
158     explicit shared_ptr(const weak_ptr<_Tp1> &__r)
159         : __shared_ptr<_Tp>(__r) {}
160 
161 #if _GLIBCXX_USE_DEPRECATED
162     template <typename _Tp1>
163     shared_ptr(std::auto_ptr<_Tp1> &&__r);
164 #endif
165 
166     // _GLIBCXX_RESOLVE_LIB_DEFECTS
167     // 2399. shared_ptr's constructor from unique_ptr should be constrained
168     template <typename _Tp1, typename _Del, typename = _Convertible<typename unique_ptr<_Tp1, _Del>::pointer>>
169     shared_ptr(std::unique_ptr<_Tp1, _Del> &&__r)
170         : __shared_ptr<_Tp>(std::move(__r)) {}
171 
172     /**
173        *  @brief  Construct an empty %shared_ptr.
174        *  @post   use_count() == 0 && get() == nullptr
175        */
176     constexpr shared_ptr(nullptr_t) noexcept : shared_ptr() {}
177 
178     shared_ptr &operator=(const shared_ptr &) noexcept = default;
179 
180     template <typename _Tp1>
181     shared_ptr &
182     operator=(const shared_ptr<_Tp1> &__r) noexcept
183     {
184       this->__shared_ptr<_Tp>::operator=(__r);
185       return *this;
186     }
187 
188 #if _GLIBCXX_USE_DEPRECATED
189     template <typename _Tp1>
190     shared_ptr &
191     operator=(std::auto_ptr<_Tp1> &&__r)
192     {
193       this->__shared_ptr<_Tp>::operator=(std::move(__r));
194       return *this;
195     }
196 #endif
197 
198     shared_ptr &
199     operator=(shared_ptr &&__r) noexcept
200     {
201       this->__shared_ptr<_Tp>::operator=(std::move(__r));
202       return *this;
203     }
204 
205     template <class _Tp1>
206     shared_ptr &
207     operator=(shared_ptr<_Tp1> &&__r) noexcept
208     {
209       this->__shared_ptr<_Tp>::operator=(std::move(__r));
210       return *this;
211     }
212 
213     template <typename _Tp1, typename _Del>
214     shared_ptr &
215     operator=(std::unique_ptr<_Tp1, _Del> &&__r)
216     {
217       this->__shared_ptr<_Tp>::operator=(std::move(__r));
218       return *this;
219     }
220 
221   private:
222     // This constructor is non-standard, it is used by allocate_shared.
223     template <typename _Alloc, typename... _Args>
224     shared_ptr(_Sp_make_shared_tag __tag, const _Alloc &__a,
225                _Args &&... __args)
226         : __shared_ptr<_Tp>(__tag, __a, std::forward<_Args>(__args)...)
227     {
228     }
229 
230     template <typename _Tp1, typename _Alloc, typename... _Args>
231     friend shared_ptr<_Tp1>
232     allocate_shared(const _Alloc &__a, _Args &&... __args);
233 
234     // This constructor is non-standard, it is used by weak_ptr::lock().
235     shared_ptr(const weak_ptr<_Tp> &__r, std::nothrow_t)
236         : __shared_ptr<_Tp>(__r, std::nothrow) {}
237 
238     friend class weak_ptr<_Tp>;
239   };

```

__shared_ptr源码

```
1 template <typename _Tp, _Lock_policy _Lp>
  2   class __shared_ptr
  3       : public __shared_ptr_access<_Tp, _Lp>
  4   {
  5   public:
  6     using element_type = typename remove_extent<_Tp>::type;
  7 
  8   private:
  9     // Constraint for taking ownership of a pointer of type _Yp*:
 10     template <typename _Yp>
 11     using _SafeConv = typename enable_if<__sp_is_constructible<_Tp, _Yp>::value>::type;
 12 
 13     // Constraint for construction from shared_ptr and weak_ptr:
 14     template <typename _Yp, typename _Res = void>
 15     using _Compatible = typename enable_if<__sp_compatible_with<_Yp *, _Tp *>::value, _Res>::type;
 16 
 17     // Constraint for assignment from shared_ptr and weak_ptr:
 18     template <typename _Yp>
 19     using _Assignable = _Compatible<_Yp, __shared_ptr &>;
 20 
 21     // Constraint for construction from unique_ptr:
 22     template <typename _Yp, typename _Del, typename _Res = void,
 23               typename _Ptr = typename unique_ptr<_Yp, _Del>::pointer>
 24     using _UniqCompatible = typename enable_if<__and_<
 25                                                    __sp_compatible_with<_Yp *, _Tp *>, is_convertible<_Ptr, element_type *>>::value,
 26                                                _Res>::type;
 27 
 28     // Constraint for assignment from unique_ptr:
 29     template <typename _Yp, typename _Del>
 30     using _UniqAssignable = _UniqCompatible<_Yp, _Del, __shared_ptr &>;
 31 
 32   public:
 33 #if __cplusplus > 201402L
 34     using weak_type = __weak_ptr<_Tp, _Lp>;
 35 #endif
 36 
 37     constexpr __shared_ptr() noexcept
 38         : _M_ptr(0), _M_refcount()
 39     {
 40     }
 41 
 42     template <typename _Yp, typename = _SafeConv<_Yp>>
 43     explicit __shared_ptr(_Yp *__p)
 44         : _M_ptr(__p), _M_refcount(__p, typename is_array<_Tp>::type())
 45     {
 46       static_assert(!is_void<_Yp>::value, "incomplete type");
 47       static_assert(sizeof(_Yp) > 0, "incomplete type");
 48       _M_enable_shared_from_this_with(__p);
 49     }
 50 
 51     template <typename _Yp, typename _Deleter, typename = _SafeConv<_Yp>>
 52     __shared_ptr(_Yp *__p, _Deleter __d)
 53         : _M_ptr(__p), _M_refcount(__p, std::move(__d))
 54     {
 55       static_assert(__is_invocable<_Deleter &, _Yp *&>::value,
 56                     "deleter expression d(p) is well-formed");
 57       _M_enable_shared_from_this_with(__p);
 58     }
 59 
 60     template <typename _Yp, typename _Deleter, typename _Alloc,
 61               typename = _SafeConv<_Yp>>
 62     __shared_ptr(_Yp *__p, _Deleter __d, _Alloc __a)
 63         : _M_ptr(__p), _M_refcount(__p, std::move(__d), std::move(__a))
 64     {
 65       static_assert(__is_invocable<_Deleter &, _Yp *&>::value,
 66                     "deleter expression d(p) is well-formed");
 67       _M_enable_shared_from_this_with(__p);
 68     }
 69 
 70     template <typename _Deleter>
 71     __shared_ptr(nullptr_t __p, _Deleter __d)
 72         : _M_ptr(0), _M_refcount(__p, std::move(__d))
 73     {
 74     }
 75 
 76     template <typename _Deleter, typename _Alloc>
 77     __shared_ptr(nullptr_t __p, _Deleter __d, _Alloc __a)
 78         : _M_ptr(0), _M_refcount(__p, std::move(__d), std::move(__a))
 79     {
 80     }
 81 
 82     template <typename _Yp>
 83     __shared_ptr(const __shared_ptr<_Yp, _Lp> &__r,
 84                  element_type *__p) noexcept
 85         : _M_ptr(__p), _M_refcount(__r._M_refcount) // never throws
 86     {
 87     }
 88 
 89     __shared_ptr(const __shared_ptr &) noexcept = default;
 90     __shared_ptr &operator=(const __shared_ptr &) noexcept = default;
 91     ~__shared_ptr() = default;
 92 
 93     template <typename _Yp, typename = _Compatible<_Yp>>
 94     __shared_ptr(const __shared_ptr<_Yp, _Lp> &__r) noexcept
 95         : _M_ptr(__r._M_ptr), _M_refcount(__r._M_refcount)
 96     {
 97     }
 98 
 99     __shared_ptr(__shared_ptr &&__r) noexcept
100         : _M_ptr(__r._M_ptr), _M_refcount()
101     {
102       _M_refcount._M_swap(__r._M_refcount);
103       __r._M_ptr = 0;
104     }
105 
106     template <typename _Yp, typename = _Compatible<_Yp>>
107     __shared_ptr(__shared_ptr<_Yp, _Lp> &&__r) noexcept
108         : _M_ptr(__r._M_ptr), _M_refcount()
109     {
110       _M_refcount._M_swap(__r._M_refcount);
111       __r._M_ptr = 0;
112     }
113 
114     template <typename _Yp, typename = _Compatible<_Yp>>
115     explicit __shared_ptr(const __weak_ptr<_Yp, _Lp> &__r)
116         : _M_refcount(__r._M_refcount) // may throw
117     {
118       // It is now safe to copy __r._M_ptr, as
119       // _M_refcount(__r._M_refcount) did not throw.
120       _M_ptr = __r._M_ptr;
121     }
122 
123     // If an exception is thrown this constructor has no effect.
124     template <typename _Yp, typename _Del,
125               typename = _UniqCompatible<_Yp, _Del>>
126     __shared_ptr(unique_ptr<_Yp, _Del> &&__r)
127         : _M_ptr(__r.get()), _M_refcount()
128     {
129       auto __raw = __to_address(__r.get());
130       _M_refcount = __shared_count<_Lp>(std::move(__r));
131       _M_enable_shared_from_this_with(__raw);
132     }
133 
134 #if __cplusplus <= 201402L && _GLIBCXX_USE_DEPRECATED
135   protected:
136     // If an exception is thrown this constructor has no effect.
137     template <typename _Tp1, typename _Del,
138               typename enable_if<__and_<
139                                      __not_<is_array<_Tp>>, is_array<_Tp1>,
140                                      is_convertible<typename unique_ptr<_Tp1, _Del>::pointer, _Tp *>>::value,
141                                  bool>::type = true>
142     __shared_ptr(unique_ptr<_Tp1, _Del> &&__r, __sp_array_delete)
143         : _M_ptr(__r.get()), _M_refcount()
144     {
145       auto __raw = __to_address(__r.get());
146       _M_refcount = __shared_count<_Lp>(std::move(__r));
147       _M_enable_shared_from_this_with(__raw);
148     }
149 
150   public:
151 #endif
152 
153 #if _GLIBCXX_USE_DEPRECATED
154 #pragma GCC diagnostic push
155 #pragma GCC diagnostic ignored "-Wdeprecated-declarations"
156     // Postcondition: use_count() == 1 and __r.get() == 0
157     template <typename _Yp, typename = _Compatible<_Yp>>
158     __shared_ptr(auto_ptr<_Yp> &&__r);
159 #pragma GCC diagnostic pop
160 #endif
161 
162     constexpr __shared_ptr(nullptr_t) noexcept : __shared_ptr()
163     {
164     }
165 
166     template <typename _Yp>
167     _Assignable<_Yp>
168     operator=(const __shared_ptr<_Yp, _Lp> &__r) noexcept
169     {
170       _M_ptr = __r._M_ptr;
171       _M_refcount = __r._M_refcount; // __shared_count::op= doesn't throw
172       return *this;
173     }
174 
175 #if _GLIBCXX_USE_DEPRECATED
176 #pragma GCC diagnostic push
177 #pragma GCC diagnostic ignored "-Wdeprecated-declarations"
178     template <typename _Yp>
179     _Assignable<_Yp>
180     operator=(auto_ptr<_Yp> &&__r)
181     {
182       __shared_ptr(std::move(__r)).swap(*this);
183       return *this;
184     }
185 #pragma GCC diagnostic pop
186 #endif
187 
188     __shared_ptr &
189     operator=(__shared_ptr &&__r) noexcept
190     {
191       __shared_ptr(std::move(__r)).swap(*this);
192       return *this;
193     }
194 
195     template <class _Yp>
196     _Assignable<_Yp>
197     operator=(__shared_ptr<_Yp, _Lp> &&__r) noexcept
198     {
199       __shared_ptr(std::move(__r)).swap(*this);
200       return *this;
201     }
202 
203     template <typename _Yp, typename _Del>
204     _UniqAssignable<_Yp, _Del>
205     operator=(unique_ptr<_Yp, _Del> &&__r)
206     {
207       __shared_ptr(std::move(__r)).swap(*this);
208       return *this;
209     }
210 
211     void
212     reset() noexcept
213     {
214       __shared_ptr().swap(*this);
215     }
216 
217     template <typename _Yp>
218     _SafeConv<_Yp>
219     reset(_Yp *__p) // _Yp must be complete.
220     {
221       // Catch self-reset errors.
222       __glibcxx_assert(__p == 0 || __p != _M_ptr);
223       __shared_ptr(__p).swap(*this);
224     }
225 
226     template <typename _Yp, typename _Deleter>
227     _SafeConv<_Yp>
228     reset(_Yp *__p, _Deleter __d)
229     {
230       __shared_ptr(__p, std::move(__d)).swap(*this);
231     }
232 
233     template <typename _Yp, typename _Deleter, typename _Alloc>
234     _SafeConv<_Yp>
235     reset(_Yp *__p, _Deleter __d, _Alloc __a)
236     {
237       __shared_ptr(__p, std::move(__d), std::move(__a)).swap(*this);
238     }
239 
240     element_type *
241     get() const noexcept
242     {
243       return _M_ptr;
244     }
245 
246     explicit operator bool() const // never throws
247     {
248       return _M_ptr == 0 ? false : true;
249     }
250 
251     bool
252     unique() const noexcept
253     {
254       return _M_refcount._M_unique();
255     }
256 
257     long
258     use_count() const noexcept
259     {
260       return _M_refcount._M_get_use_count();
261     }
262 
263     void
264     swap(__shared_ptr<_Tp, _Lp> &__other) noexcept
265     {
266       std::swap(_M_ptr, __other._M_ptr);
267       _M_refcount._M_swap(__other._M_refcount);
268     }
269 
270     template <typename _Tp1>
271     bool
272     owner_before(__shared_ptr<_Tp1, _Lp> const &__rhs) const noexcept
273     {
274       return _M_refcount._M_less(__rhs._M_refcount);
275     }
276 
277     template <typename _Tp1>
278     bool
279     owner_before(__weak_ptr<_Tp1, _Lp> const &__rhs) const noexcept
280     {
281       return _M_refcount._M_less(__rhs._M_refcount);
282     }
283 
284   protected:
285     // This constructor is non-standard, it is used by allocate_shared.
286     template <typename _Alloc, typename... _Args>
287     __shared_ptr(_Sp_make_shared_tag __tag, const _Alloc &__a,
288                  _Args &&... __args)
289         : _M_ptr(), _M_refcount(__tag, (_Tp *)0, __a,
290                                 std::forward<_Args>(__args)...)
291     {
292       // _M_ptr needs to point to the newly constructed object.
293       // This relies on _Sp_counted_ptr_inplace::_M_get_deleter.
294 #if __cpp_rtti
295       void *__p = _M_refcount._M_get_deleter(typeid(__tag));
296 #else
297       void *__p = _M_refcount._M_get_deleter(_Sp_make_shared_tag::_S_ti());
298 #endif
299       _M_ptr = static_cast<_Tp *>(__p);
300       _M_enable_shared_from_this_with(_M_ptr);
301     }
302 
303     template <typename _Tp1, _Lock_policy _Lp1, typename _Alloc,
304               typename... _Args>
305     friend __shared_ptr<_Tp1, _Lp1>
306     __allocate_shared(const _Alloc &__a, _Args &&... __args);
307 
308     // This constructor is used by __weak_ptr::lock() and
309     // shared_ptr::shared_ptr(const weak_ptr&, std::nothrow_t).
310     __shared_ptr(const __weak_ptr<_Tp, _Lp> &__r, std::nothrow_t)
311         : _M_refcount(__r._M_refcount, std::nothrow)
312     {
313       _M_ptr = _M_refcount._M_get_use_count() ? __r._M_ptr : nullptr;
314     }
315 
316     friend class __weak_ptr<_Tp, _Lp>;
317 
318   private:
319     template <typename _Yp>
320     using __esft_base_t = decltype(__enable_shared_from_this_base(
321         std::declval<const __shared_count<_Lp> &>(),
322         std::declval<_Yp *>()));
323 
324     // Detect an accessible and unambiguous enable_shared_from_this base.
325     template <typename _Yp, typename = void>
326     struct __has_esft_base
327         : false_type
328     {
329     };
330 
331     template <typename _Yp>
332     struct __has_esft_base<_Yp, __void_t<__esft_base_t<_Yp>>>
333         : __not_<is_array<_Tp>>
334     {
335     }; // No enable shared_from_this for arrays
336 
337     template <typename _Yp, typename _Yp2 = typename remove_cv<_Yp>::type>
338     typename enable_if<__has_esft_base<_Yp2>::value>::type
339     _M_enable_shared_from_this_with(_Yp *__p) noexcept
340     {
341       if (auto __base = __enable_shared_from_this_base(_M_refcount, __p))
342         __base->_M_weak_assign(const_cast<_Yp2 *>(__p), _M_refcount);
343     }
344 
345     template <typename _Yp, typename _Yp2 = typename remove_cv<_Yp>::type>
346     typename enable_if<!__has_esft_base<_Yp2>::value>::type
347     _M_enable_shared_from_this_with(_Yp *) noexcept
348     {
349     }
350 
351     void *
352     _M_get_deleter(const std::type_info &__ti) const noexcept
353     {
354       return _M_refcount._M_get_deleter(__ti);
355     }
356 
357     template <typename _Tp1, _Lock_policy _Lp1>
358     friend class __shared_ptr;
359     template <typename _Tp1, _Lock_policy _Lp1>
360     friend class __weak_ptr;
361 
362     template <typename _Del, typename _Tp1, _Lock_policy _Lp1>
363     friend _Del *get_deleter(const __shared_ptr<_Tp1, _Lp1> &) noexcept;
364 
365     template <typename _Del, typename _Tp1>
366     friend _Del *get_deleter(const shared_ptr<_Tp1> &) noexcept;
367 
368     element_type *_M_ptr;            // Contained pointer.
369     __shared_count<_Lp> _M_refcount; // Reference counter.
370   };
```

__shared_count源码
```
1   template <_Lock_policy _Lp>
  2   class __shared_count
  3   {
  4   public:
  5     constexpr __shared_count() noexcept : _M_pi(0)
  6     {
  7     }
  8 
  9     template <typename _Ptr>
 10     explicit __shared_count(_Ptr __p) : _M_pi(0)
 11     {
 12       __try
 13       {
 14         _M_pi = new _Sp_counted_ptr<_Ptr, _Lp>(__p);
 15       }
 16       __catch(...)
 17       {
 18         delete __p;
 19         __throw_exception_again;
 20       }
 21     }
 22 
 23     template <typename _Ptr>
 24     __shared_count(_Ptr __p, /* is_array = */ false_type)
 25         : __shared_count(__p)
 26     {
 27     }
 28 
 29     template <typename _Ptr>
 30     __shared_count(_Ptr __p, /* is_array = */ true_type)
 31         : __shared_count(__p, __sp_array_delete{}, allocator<void>())
 32     {
 33     }
 34 
 35     template <typename _Ptr, typename _Deleter>
 36     __shared_count(_Ptr __p, _Deleter __d)
 37         : __shared_count(__p, std::move(__d), allocator<void>())
 38     {
 39     }
 40 
 41     template <typename _Ptr, typename _Deleter, typename _Alloc>
 42     __shared_count(_Ptr __p, _Deleter __d, _Alloc __a) : _M_pi(0)
 43     {
 44       typedef _Sp_counted_deleter<_Ptr, _Deleter, _Alloc, _Lp> _Sp_cd_type;
 45       __try
 46       {
 47         typename _Sp_cd_type::__allocator_type __a2(__a);
 48         auto __guard = std::__allocate_guarded(__a2);
 49         _Sp_cd_type *__mem = __guard.get();
 50         ::new (__mem) _Sp_cd_type(__p, std::move(__d), std::move(__a));
 51         _M_pi = __mem;
 52         __guard = nullptr;
 53       }
 54       __catch(...)
 55       {
 56         __d(__p); // Call _Deleter on __p.
 57         __throw_exception_again;
 58       }
 59     }
 60 
 61     template <typename _Tp, typename _Alloc, typename... _Args>
 62     __shared_count(_Sp_make_shared_tag, _Tp *, const _Alloc &__a,
 63                    _Args &&... __args)
 64         : _M_pi(0)
 65     {
 66       typedef _Sp_counted_ptr_inplace<_Tp, _Alloc, _Lp> _Sp_cp_type;
 67       typename _Sp_cp_type::__allocator_type __a2(__a);
 68       auto __guard = std::__allocate_guarded(__a2);
 69       _Sp_cp_type *__mem = __guard.get();
 70       ::new (__mem) _Sp_cp_type(std::move(__a),
 71                                 std::forward<_Args>(__args)...);
 72       _M_pi = __mem;
 73       __guard = nullptr;
 74     }
 75 
 76 #if _GLIBCXX_USE_DEPRECATED
 77 #pragma GCC diagnostic push
 78 #pragma GCC diagnostic ignored "-Wdeprecated-declarations"
 79     // Special case for auto_ptr<_Tp> to provide the strong guarantee.
 80     template <typename _Tp>
 81     explicit __shared_count(std::auto_ptr<_Tp> &&__r);
 82 #pragma GCC diagnostic pop
 83 #endif
 84 
 85     // Special case for unique_ptr<_Tp,_Del> to provide the strong guarantee.
 86     template <typename _Tp, typename _Del>
 87     explicit __shared_count(std::unique_ptr<_Tp, _Del> &&__r) : _M_pi(0)
 88     {
 89       // _GLIBCXX_RESOLVE_LIB_DEFECTS
 90       // 2415. Inconsistency between unique_ptr and shared_ptr
 91       if (__r.get() == nullptr)
 92         return;
 93 
 94       using _Ptr = typename unique_ptr<_Tp, _Del>::pointer;
 95       using _Del2 = typename conditional<is_reference<_Del>::value,
 96                                          reference_wrapper<typename remove_reference<_Del>::type>,
 97                                          _Del>::type;
 98       using _Sp_cd_type = _Sp_counted_deleter<_Ptr, _Del2, allocator<void>, _Lp>;
 99       using _Alloc = allocator<_Sp_cd_type>;
100       using _Alloc_traits = allocator_traits<_Alloc>;
101       _Alloc __a;
102       _Sp_cd_type *__mem = _Alloc_traits::allocate(__a, 1);
103       _Alloc_traits::construct(__a, __mem, __r.release(),
104                                __r.get_deleter()); // non-throwing
105       _M_pi = __mem;
106     }
107 
108     // Throw bad_weak_ptr when __r._M_get_use_count() == 0.
109     explicit __shared_count(const __weak_count<_Lp> &__r);
110 
111     // Does not throw if __r._M_get_use_count() == 0, caller must check.
112     explicit __shared_count(const __weak_count<_Lp> &__r, std::nothrow_t);
113 
114     ~__shared_count() noexcept
115     {
116       if (_M_pi != nullptr)
117         _M_pi->_M_release();
118     }
119 
120     __shared_count(const __shared_count &__r) noexcept
121         : _M_pi(__r._M_pi)
122     {
123       if (_M_pi != 0)
124         _M_pi->_M_add_ref_copy();
125     }
126 
127     __shared_count &
128     operator=(const __shared_count &__r) noexcept
129     {
130       _Sp_counted_base<_Lp> *__tmp = __r._M_pi;
131       if (__tmp != _M_pi)
132       {
133         if (__tmp != 0)
134           __tmp->_M_add_ref_copy();
135         if (_M_pi != 0)
136           _M_pi->_M_release();
137         _M_pi = __tmp;
138       }
139       return *this;
140     }
141 
142     void
143     _M_swap(__shared_count &__r) noexcept
144     {
145       _Sp_counted_base<_Lp> *__tmp = __r._M_pi;
146       __r._M_pi = _M_pi;
147       _M_pi = __tmp;
148     }
149 
150     long
151     _M_get_use_count() const noexcept
152     {
153       return _M_pi != 0 ? _M_pi->_M_get_use_count() : 0;
154     }
155 
156     bool
157     _M_unique() const noexcept
158     {
159       return this->_M_get_use_count() == 1;
160     }
161 
162     void *
163     _M_get_deleter(const std::type_info &__ti) const noexcept
164     {
165       return _M_pi ? _M_pi->_M_get_deleter(__ti) : nullptr;
166     }
167 
168     bool
169     _M_less(const __shared_count &__rhs) const noexcept
170     {
171       return std::less<_Sp_counted_base<_Lp> *>()(this->_M_pi, __rhs._M_pi);
172     }
173 
174     bool
175     _M_less(const __weak_count<_Lp> &__rhs) const noexcept
176     {
177       return std::less<_Sp_counted_base<_Lp> *>()(this->_M_pi, __rhs._M_pi);
178     }
179 
180     // Friend function injected into enclosing namespace and found by ADL
181     friend inline bool
182     operator==(const __shared_count &__a, const __shared_count &__b) noexcept
183     {
184       return __a._M_pi == __b._M_pi;
185     }
186 
187   private:
188     friend class __weak_count<_Lp>;
189 
190     _Sp_counted_base<_Lp> *_M_pi;
191   };
 ```